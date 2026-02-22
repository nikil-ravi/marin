import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DirectoryTable from './components/view/DirectoryTable';
import FilterSortHighlightPanel from './components/view/FilterSortHighlightPanel';
import JsonTree from './components/view/JsonTree';
import PathListPanel from './components/view/PathListPanel';
import RecordComparisonTable from './components/view/RecordComparisonTable';
import ViewToolbar from './components/view/ViewToolbar';
import { EmptyState, ErrorState, LoadingState } from './components/StateViews';
import useViewQueryState from './hooks/useViewQueryState';
import { apiViewUrl, experimentUrl, isUrl, checkJsonResponse } from './utils';

function isRecordPayload(payload) {
  return payload && Array.isArray(payload.items) && (payload.type === 'jsonl' || payload.type === 'parquet');
}

function isExperiment(item) {
  return item && item.prefix && item.steps;
}

function highlightsMatch(highlights, itemKey) {
  if (highlights.highlights.length === 0) {
    return true;
  }
  return highlights.highlights.some((highlight) => {
    const length = Math.min(highlight.length, itemKey.length);
    for (let i = 0; i < length; i += 1) {
      if (highlight[i] !== itemKey[i]) {
        return false;
      }
    }
    return true;
  });
}

function itemMatchesFilter(item, filter) {
  if (filter.key.length === 0) {
    switch (filter.rel) {
      case '=':
        return item === filter.value;
      case '<':
        return typeof item === 'number' && item < filter.value;
      case '>':
        return typeof item === 'number' && item > filter.value;
      case '<=':
        return typeof item === 'number' && item <= filter.value;
      case '>=':
        return typeof item === 'number' && item >= filter.value;
      case '!=':
        return item !== filter.value;
      case '=~':
        return typeof item === 'string' && item.includes(filter.value);
      default:
        return false;
    }
  }

  const [first, ...rest] = filter.key;
  if (typeof item === 'object' && item !== null && first in item) {
    return itemMatchesFilter(item[first], { ...filter, key: rest });
  }
  return false;
}

function getNestedValue(item, key) {
  if (key.length === 0) {
    return item;
  }
  const [head, ...tail] = key;
  if (item === null || typeof item !== 'object' || !(head in item)) {
    return null;
  }
  return getNestedValue(item[head], tail);
}

function filterRowIndices(rowIndices, paths, payloads, filters) {
  return rowIndices.filter((rowIndex) => {
    return filters.filters.every((filter) => {
      const [pathIndex, ...key] = filter.key;
      const payload = payloads[paths[pathIndex]];
      if (!isRecordPayload(payload)) {
        return false;
      }
      return itemMatchesFilter(payload.items[rowIndex], { ...filter, key });
    });
  });
}

function sortRowIndices(rowIndices, paths, payloads, sort) {
  if (!sort.key) {
    return rowIndices;
  }
  const [pathIndex, ...key] = sort.key;
  const payload = payloads[paths[pathIndex]];
  if (!isRecordPayload(payload)) {
    return rowIndices;
  }

  return rowIndices.slice().sort((left, right) => {
    const leftValue = getNestedValue(payload.items[left], key);
    const rightValue = getNestedValue(payload.items[right], key);
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue;
    }
    if (typeof leftValue === 'string' && typeof rightValue === 'string') {
      return leftValue.localeCompare(rightValue);
    }
    return 0;
  });
}

function renderJsonLikeItem({
  item,
  itemKey,
  highlights,
  showOnlyHighlights,
  onQuickAction,
  onOpenGsPath,
}) {
  if (item === null) {
    return <Typography variant="body2" color="text.secondary">null</Typography>;
  }

  if (typeof item === 'string') {
    if (isUrl(item)) {
      return <a href={item} target="_blank" rel="noreferrer">{item}</a>;
    }
    if (item.startsWith('gs://')) {
      return <Button variant="text" onClick={() => onOpenGsPath(item)}>{item}</Button>;
    }
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }} onClick={(e) => onQuickAction(itemKey, e)}>
        {item}
      </Typography>
    );
  }

  if (typeof item === 'number' || typeof item === 'boolean') {
    return (
      <Typography variant="body2" onClick={(e) => onQuickAction(itemKey, e)}>
        {JSON.stringify(item)}
      </Typography>
    );
  }

  if (typeof item === 'object') {
    const entries = Object.entries(item);
    return (
      <Stack spacing={0.5} sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}>
        {entries.map(([key, value]) => {
          const nextKey = itemKey.concat([Array.isArray(item) ? Number(key) : key]);
          if (showOnlyHighlights && !highlightsMatch(highlights, nextKey)) {
            return null;
          }
          return (
            <Stack key={nextKey.join('.')} direction="row" spacing={1} alignItems="flex-start">
              <Typography variant="body2" color="text.secondary">
                {Array.isArray(item) ? `[${key}]` : key}:
              </Typography>
              {renderJsonLikeItem({
                item: value,
                itemKey: nextKey,
                highlights,
                showOnlyHighlights,
                onQuickAction,
                onOpenGsPath,
              })}
            </Stack>
          );
        })}
      </Stack>
    );
  }

  return <Typography variant="body2">{JSON.stringify(item)}</Typography>;
}

function ViewPage() {
  const {
    location,
    pathsResult,
    filters,
    sort,
    highlights,
    offset,
    count,
    reverse,
    showOnlyHighlights,
    updateUrlParams,
  } = useViewQueryState();
  const paths = pathsResult.paths;

  const [error, setError] = useState(null);
  const [payloads, setPayloads] = useState({});
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    setError(pathsResult.error || filters.error || sort.error || highlights.error || null);
  }, [pathsResult.error, filters.error, sort.error, highlights.error]);

  useEffect(() => {
    let active = true;
    async function fetchPayloads() {
      if (paths.length === 0) {
        setPayloads({});
        return;
      }

      setPayloads((previous) =>
        Object.fromEntries(paths.filter((path) => previous[path]).map((path) => [path, previous[path]])),
      );

      const results = await Promise.all(paths.map(async (path) => {
        try {
          const response = await axios.get(apiViewUrl({ path, offset, count }));
          const payload = checkJsonResponse(response, setError);
          return [path, payload];
        } catch (fetchError) {
          setError(fetchError.message);
          return [path, { error: fetchError.message }];
        }
      }));

      if (!active) {
        return;
      }
      const nextPayloads = {};
      results.forEach(([path, payload]) => {
        if (payload) {
          nextPayloads[path] = payload;
        }
      });
      setPayloads(nextPayloads);
    }

    fetchPayloads();
    return () => {
      active = false;
    };
  }, [paths, offset, count, location.search, refreshNonce]);

  const recordPathGroups = useMemo(() => {
    return paths
      .map((path, index) => ({ path, index, payload: payloads[path] }))
      .filter(({ payload }) => isRecordPayload(payload))
      .map(({ path, index, payload }) => ({ path, index, items: payload.items }));
  }, [paths, payloads]);

  const actualCount = recordPathGroups.length > 0 ? recordPathGroups[0].items.length : 0;

  const rowIndices = useMemo(() => {
    if (recordPathGroups.length === 0) {
      return [];
    }
    const baseRows = recordPathGroups[0].items.map((_, index) => index);
    let nextRows = filterRowIndices(baseRows, paths, payloads, filters);
    nextRows = sortRowIndices(nextRows, paths, payloads, sort);
    if (reverse) {
      nextRows = nextRows.slice().reverse();
    }
    return nextRows;
  }, [recordPathGroups, paths, payloads, filters, sort, reverse]);

  function setPaths(nextPaths) {
    updateUrlParams({
      paths: nextPaths.length > 0 ? JSON.stringify(nextPaths) : null,
      offset: 0,
    });
  }

  function applyPath(index, newPath) {
    if (!newPath) {
      return;
    }
    const nextPaths = [...paths];
    nextPaths[index] = newPath;
    setPaths(nextPaths);
  }

  function clonePath(path) {
    setPaths(paths.concat([path]));
  }

  function removePath(index) {
    setPaths(paths.filter((_, i) => i !== index));
  }

  function addPath(path) {
    setPaths(paths.concat([path]));
  }

  function onQuickAction(itemKey, event) {
    if (!event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (event.altKey) {
      updateUrlParams({ highlights: JSON.stringify(highlights.highlights.concat([itemKey])) });
      return;
    }
    updateUrlParams({ sort: JSON.stringify(itemKey) });
  }

  function renderRecordItem(item, itemKey) {
    return renderJsonLikeItem({
      item,
      itemKey,
      highlights,
      showOnlyHighlights,
      onQuickAction,
      onOpenGsPath: (path) => {
        updateUrlParams({ paths: JSON.stringify([path]), offset: 0 });
      },
    });
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (paths.length === 0) {
    return <EmptyState title="No paths selected" body="Add at least one path to start browsing." />;
  }

  if (!payloads[paths[0]]) {
    return <LoadingState label="Loading selected paths..." lines={4} />;
  }

  return (
    <Stack spacing={2}>
      <ViewToolbar
        offset={offset}
        count={count}
        actualCount={actualCount}
        canGoPrev={offset > 0}
        canGoNext={recordPathGroups.length > 0 && actualCount === count}
        onPrev={() => updateUrlParams({ offset: Math.max(0, offset - count) })}
        onNext={() => updateUrlParams({ offset: offset + count })}
        onApplyWindow={(nextOffset, nextCount) => updateUrlParams({ offset: nextOffset, count: nextCount })}
        onRefresh={() => setRefreshNonce((prev) => prev + 1)}
      />

      <FilterSortHighlightPanel
        filters={filters}
        sort={sort}
        reverse={reverse}
        highlights={highlights}
        showOnlyHighlights={showOnlyHighlights}
        onSetFilters={(nextFilters) => updateUrlParams({ filters: nextFilters.length > 0 ? JSON.stringify(nextFilters) : null })}
        onSetSort={(nextSort) => updateUrlParams({ sort: nextSort ? JSON.stringify(nextSort) : null })}
        onSetReverse={(nextReverse) => updateUrlParams({ reverse: nextReverse ? true : null })}
        onSetHighlights={(nextHighlights) => updateUrlParams({ highlights: nextHighlights.length > 0 ? JSON.stringify(nextHighlights) : null })}
        onSetShowOnlyHighlights={(nextShowOnlyHighlights) =>
          updateUrlParams({ showOnlyHighlights: nextShowOnlyHighlights ? true : null })
        }
      />

      <PathListPanel
        paths={paths}
        payloads={payloads}
        onApplyPath={applyPath}
        onClonePath={clonePath}
        onRemovePath={removePath}
        onAddPath={addPath}
      />

      <Typography variant="body2" color="text.secondary">
        Tip: shift-click any value to sort by that path. Shift+Alt-click adds that path to highlights.
      </Typography>

      {paths.map((path, index) => {
        const payload = payloads[path];
        if (!payload) {
          return null;
        }
        if (payload.error) {
          return <ErrorState key={path} message={payload.error} />;
        }

        if (payload.type === 'directory') {
          return (
            <DirectoryTable
              key={path}
              title={`Directory ${path}`}
              files={payload.files || []}
              onOpenPath={(nextPath) => applyPath(index, nextPath)}
            />
          );
        }

        if (payload.type === 'json') {
          return (
            <Stack key={path} spacing={1}>
              {isExperiment(payload.data) && (
                <Button variant="contained" href={experimentUrl({ path })}>
                  Open experiment view
                </Button>
              )}
              <JsonTree title={path} value={payload.data} />
            </Stack>
          );
        }

        if (payload.type === 'text') {
          return (
            <Paper key={path} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {path}
              </Typography>
              <Typography component="pre" variant="body2" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {(payload.items || []).join('')}
              </Typography>
            </Paper>
          );
        }

        return null;
      })}

      {recordPathGroups.length > 0 && (
        <RecordComparisonTable
          pathGroups={recordPathGroups}
          rowIndices={rowIndices}
          offset={offset}
          renderItem={renderRecordItem}
        />
      )}
    </Stack>
  );
}

export default ViewPage;
