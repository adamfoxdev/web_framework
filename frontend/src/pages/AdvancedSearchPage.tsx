import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../services/searchService';
import { useWorkspace } from '../context/WorkspaceContext';
import type { SearchResult, SearchParams, PagedResponse } from '../types';

const ENTITY_TYPES = [
  { key: 'project', label: 'Projects', icon: '📂', color: '#3b82f6' },
  { key: 'dataset', label: 'Datasets', icon: '📊', color: '#10b981' },
  { key: 'form', label: 'Forms', icon: '📝', color: '#8b5cf6' },
  { key: 'rule', label: 'Quality Rules', icon: '✅', color: '#f59e0b' },
  { key: 'query', label: 'Queries', icon: '🔎', color: '#06b6d4' },
  { key: 'user', label: 'Users', icon: '👤', color: '#ec4899' },
  { key: 'workspace', label: 'Workspaces', icon: '🏢', color: '#6366f1' },
];

const CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted'];
const STATUSES = ['Active', 'Inactive', 'Draft', 'Published', 'Archived', 'Deprecated'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Entity Type' },
  { value: 'createdat', label: 'Created Date' },
  { value: 'updatedat', label: 'Updated Date' },
];

export default function AdvancedSearchPage() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  // Search state
  const [queryText, setQueryText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [classification, setClassification] = useState('');
  const [containsPii, setContainsPii] = useState<'' | 'true' | 'false'>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Results state
  const [results, setResults] = useState<PagedResponse<SearchResult> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const params: SearchParams = {
        q: queryText || undefined,
        entityType: selectedTypes.size > 0 ? Array.from(selectedTypes).join(',') : undefined,
        status: status || undefined,
        workspace: activeWorkspace?.id || undefined,
        tag: tag || undefined,
        createdBy: createdBy || undefined,
        classification: classification || undefined,
        containsPii: containsPii === '' ? undefined : containsPii === 'true',
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortDesc,
        page: p,
        pageSize,
      };
      const data = await searchService.search(params);
      setResults(data);
      setHasSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [queryText, selectedTypes, status, activeWorkspace, tag, createdBy, classification, containsPii, dateFrom, dateTo, sortBy, sortDesc, page, pageSize]);

  // Debounced auto-search on query text change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      doSearch(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryText]);

  // Re-search on filter/sort changes (not queryText — that has debounce)
  useEffect(() => {
    setPage(1);
    doSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, status, tag, createdBy, classification, containsPii, dateFrom, dateTo, sortBy, sortDesc, activeWorkspace]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    doSearch(newPage);
    window.scrollTo(0, 0);
  };

  const toggleType = (key: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setStatus('');
    setTag('');
    setCreatedBy('');
    setClassification('');
    setContainsPii('');
    setDateFrom('');
    setDateTo('');
    setSortBy('relevance');
    setSortDesc(true);
  };

  const activeFilterCount = [
    selectedTypes.size > 0, status, tag, createdBy, classification, containsPii, dateFrom, dateTo,
  ].filter(Boolean).length;

  const navigateToEntity = (r: SearchResult) => {
    switch (r.entityType) {
      case 'project': case 'dataset': case 'form': case 'rule':
        navigate('/projects');
        break;
      case 'query':
        navigate('/queries');
        break;
      case 'user':
        navigate('/users');
        break;
      case 'workspace':
        navigate('/workspaces');
        break;
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const entityMeta = (type: string) => ENTITY_TYPES.find(e => e.key === type)!;

  return (
    <div className="as-container">
      {/* Header */}
      <div className="as-header">
        <div className="as-header-top">
          <h1 className="as-title">🔍 Advanced Search</h1>
          <span className="as-subtitle">
            Find any entity across the application
            {activeWorkspace && <> — filtered to <strong>{activeWorkspace.name}</strong></>}
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="as-searchbar">
        <div className="as-input-wrap">
          <span className="as-input-icon">⌕</span>
          <input
            ref={inputRef}
            type="text"
            className="as-input"
            placeholder="Search projects, datasets, queries, users, workspaces..."
            value={queryText}
            onChange={e => setQueryText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); doSearch(1); } }}
          />
          {queryText && (
            <button className="as-input-clear" onClick={() => setQueryText('')}>×</button>
          )}
        </div>
        <button className="as-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
          ⚙ Filters {activeFilterCount > 0 && <span className="as-filter-badge">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Entity type chips */}
      <div className="as-type-chips">
        {ENTITY_TYPES.map(et => (
          <button
            key={et.key}
            className={`as-chip ${selectedTypes.has(et.key) ? 'active' : ''}`}
            style={{ '--chip-color': et.color } as React.CSSProperties}
            onClick={() => toggleType(et.key)}
          >
            <span className="as-chip-icon">{et.icon}</span>
            {et.label}
          </button>
        ))}
        {selectedTypes.size > 0 && (
          <button className="as-chip as-chip-clear" onClick={() => setSelectedTypes(new Set())}>
            Clear types
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="as-filters-panel">
          <div className="as-filters-grid">
            <div className="as-filter-group">
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Any status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="as-filter-group">
              <label>Classification</label>
              <select value={classification} onChange={e => setClassification(e.target.value)}>
                <option value="">Any classification</option>
                {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="as-filter-group">
              <label>Contains PII</label>
              <select value={containsPii} onChange={e => setContainsPii(e.target.value as '' | 'true' | 'false')}>
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="as-filter-group">
              <label>Tag</label>
              <input type="text" placeholder="e.g. ETL, compliance" value={tag} onChange={e => setTag(e.target.value)} />
            </div>
            <div className="as-filter-group">
              <label>Created By</label>
              <input type="text" placeholder="e.g. admin" value={createdBy} onChange={e => setCreatedBy(e.target.value)} />
            </div>
            <div className="as-filter-group">
              <label>Date From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="as-filter-group">
              <label>Date To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="as-filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="as-filter-group">
              <label>Direction</label>
              <select value={sortDesc ? 'desc' : 'asc'} onChange={e => setSortDesc(e.target.value === 'desc')}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
          <div className="as-filters-actions">
            <button className="btn btn-outline" onClick={clearFilters}>Clear All Filters</button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="as-error">⚠ {error}</div>}

      {/* Results */}
      {loading && (
        <div className="as-loading">
          <div className="as-spinner" />
          <span>Searching...</span>
        </div>
      )}

      {!loading && results && (
        <>
          {/* Stats bar */}
          <div className="as-stats">
            <span className="as-stats-count">
              {results.totalCount} result{results.totalCount !== 1 ? 's' : ''} found
            </span>
            <div className="as-stats-types">
              {ENTITY_TYPES.map(et => {
                const count = results.items.filter(r => r.entityType === et.key).length;
                if (count === 0 && results.page === 1 && results.totalPages <= 1) return null;
                return count > 0 ? (
                  <span key={et.key} className="as-stats-type" style={{ color: et.color }}>
                    {et.icon} {count}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Result cards */}
          {results.items.length === 0 && hasSearched ? (
            <div className="as-empty">
              <div className="as-empty-icon">🔍</div>
              <h3>No results found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="as-results">
              {results.items.map(r => {
                const meta = entityMeta(r.entityType);
                return (
                  <div key={`${r.entityType}-${r.id}`} className="as-card" onClick={() => navigateToEntity(r)}>
                    <div className="as-card-left">
                      <div className="as-card-icon" style={{ background: meta.color }}>
                        {meta.icon}
                      </div>
                    </div>
                    <div className="as-card-body">
                      <div className="as-card-top">
                        <span className="as-card-type" style={{ color: meta.color }}>
                          {meta.label.replace(/s$/, '')}
                        </span>
                        {r.parentProjectName && (
                          <span className="as-card-parent">in {r.parentProjectName}</span>
                        )}
                        {r.status && (
                          <span className={`as-card-status as-status-${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        )}
                      </div>
                      <h3 className="as-card-name">{r.name}</h3>
                      <p className="as-card-desc">{r.description}</p>
                      <div className="as-card-meta">
                        {r.createdBy && <span className="as-card-meta-item">👤 {r.createdBy}</span>}
                        <span className="as-card-meta-item">📅 {formatDate(r.createdAt)}</span>
                        {r.classification && (
                          <span className={`as-card-badge as-class-${r.classification.toLowerCase()}`}>
                            {r.classification}
                          </span>
                        )}
                        {r.containsPii && <span className="as-card-badge as-pii">PII</span>}
                        {r.dataOwner && <span className="as-card-meta-item">🏷 {r.dataOwner}</span>}
                        {r.tags && r.tags.length > 0 && r.tags.map(t => (
                          <span key={t} className="as-card-tag" onClick={e => { e.stopPropagation(); setTag(t); }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="as-card-arrow">→</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="as-pagination">
              <button
                className="as-page-btn"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                ← Prev
              </button>
              <div className="as-page-numbers">
                {Array.from({ length: results.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === results.totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | string)[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1]) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`ellipsis-${i}`} className="as-page-ellipsis">{p}</span>
                    ) : (
                      <button
                        key={p}
                        className={`as-page-num ${p === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                className="as-page-btn"
                disabled={page >= results.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Keyboard shortcut hint */}
      {!hasSearched && !loading && (
        <div className="as-hint">
          <div className="as-hint-icon">🔍</div>
          <h3>Search across everything</h3>
          <p>Find projects, datasets, forms, quality rules, queries, users, and workspaces all in one place.</p>
          <div className="as-hint-tips">
            <div className="as-hint-tip"><span className="as-hint-key">Enter</span> Search</div>
            <div className="as-hint-tip"><span className="as-hint-key">⚙</span> Toggle advanced filters</div>
            <div className="as-hint-tip"><span className="as-hint-key">Chips</span> Filter by entity type</div>
          </div>
        </div>
      )}
    </div>
  );
}
