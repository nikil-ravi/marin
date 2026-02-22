import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigateToUrl } from '../utils';

function parseJsonArrayParam(str, label, emptyValue) {
  if (!str) {
    return { ...emptyValue };
  }
  try {
    const result = JSON.parse(str);
    if (!Array.isArray(result)) {
      return { ...emptyValue, error: `Invalid ${label} (should be JSON array): ${str}` };
    }
    return result;
  } catch (error) {
    return { ...emptyValue, error: `Invalid ${label} (invalid JSON): ${str}` };
  }
}

export function parseKeyPathInput(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }
  return trimmed
    .split('.')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      const numeric = Number(part);
      return Number.isInteger(numeric) && `${numeric}` === part ? numeric : part;
    });
}

export function formatKeyPath(key) {
  return key.map((part) => String(part)).join('.');
}

export default function useViewQueryState() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const pathsResult = useMemo(() => {
    const parsed = parseJsonArrayParam(params.get('paths'), 'paths', { paths: [] });
    if (Array.isArray(parsed)) {
      return { paths: parsed };
    }
    return parsed;
  }, [params]);

  const filters = useMemo(() => {
    const parsed = parseJsonArrayParam(params.get('filters'), 'filters', { filters: [] });
    if (Array.isArray(parsed)) {
      return { filters: parsed };
    }
    return parsed;
  }, [params]);

  const sort = useMemo(() => {
    const rawSort = params.get('sort');
    if (!rawSort) {
      return { key: null };
    }
    const parsed = parseJsonArrayParam(rawSort, 'sort', { key: null });
    if (Array.isArray(parsed)) {
      return { key: parsed };
    }
    return parsed;
  }, [params]);

  const highlights = useMemo(() => {
    const parsed = parseJsonArrayParam(params.get('highlights'), 'highlights', { highlights: [] });
    if (Array.isArray(parsed)) {
      return { highlights: parsed };
    }
    return parsed;
  }, [params]);

  const offset = Math.max(0, Number.parseInt(params.get('offset') || '0', 10) || 0);
  const count = Math.max(1, Number.parseInt(params.get('count') || '5', 10) || 5);
  const reverse = params.get('reverse') === 'true';
  const showOnlyHighlights = params.get('showOnlyHighlights') === 'true';

  function updateUrlParams(delta, nextPathname = location.pathname) {
    const urlParams = new URLSearchParams(location.search);
    navigateToUrl(urlParams, delta, { pathname: nextPathname }, navigate);
  }

  return {
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
  };
}
