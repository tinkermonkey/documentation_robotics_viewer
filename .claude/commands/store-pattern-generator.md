---
description: Generate Zustand store with optimistic updates and WebSocket sync
argument-hint: "<storeName> [--async <action1,action2>] [--persist]"
---

# Store Pattern Generator

Automates Zustand store creation with optimistic update patterns and WebSocket synchronization support.

## Purpose

Creating a Zustand store requires consistent patterns for:
- State management with TypeScript types
- Synchronous actions (setters, add, update, remove)
- Async actions with optimistic UI updates
- Computed selectors using `get()`
- Optional localStorage persistence

This command generates production-ready stores following the patterns in `annotationStore.ts` and `modelStore.ts`.

## Usage

```bash
/store-pattern-generator featureStore --async createFeature,deleteFeature
/store-pattern-generator preferencesStore --persist
/store-pattern-generator notificationStore --async createNotification,markAsRead --persist
```

## Arguments

- `<storeName>` (required): camelCase store name (e.g., featureStore, userPreferenceStore)
- `--async <actions>` (optional): Comma-separated list of async actions (e.g., createFeature,deleteFeature,updateFeature)
- `--persist` (optional): Add localStorage persistence with Zustand persist middleware

## Workflow (4 Phases)

### Phase 1: Interface Definition (20%)

Generate TypeScript interfaces for the store:

```typescript
// File: src/stores/{storeName}.ts
import { create } from 'zustand';
{{#if persist}}
import { persist } from 'zustand/middleware';
{{/if}}

// Main item type - customize this based on your domain
interface {ItemType} {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // Add domain-specific properties here
}

// Input type for creating new items (typically omits id, timestamps)
interface {ItemType}Input {
  name: string;
  // Add other properties needed for creation
}

// Store interface
interface {StoreName}Store {
  // STATE
  items: {ItemType}[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;

  // SYNCHRONOUS ACTIONS
  setItems: (items: {ItemType}[]) => void;
  addItem: (item: {ItemType}) => void;
  updateItem: (id: string, updates: Partial<{ItemType}>) => void;
  removeItem: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  {{#if hasAsyncActions}}
  // ASYNC ACTIONS (with optimistic updates)
  {{#each asyncActions}}
  {{{this}}}: (...args: any[]) => Promise<void>;
  {{/each}}
  {{/if}}

  // COMPUTED SELECTORS
  getItemById: (id: string) => {ItemType} | undefined;
  getSelectedItem: () => {ItemType} | undefined;
  getItemCount: () => number;
}
```

**Variables to extract**:
- `StoreName`: PascalCase (e.g., FeatureStore)
- `storeName`: camelCase (e.g., featureStore)
- `ItemType`: Singular PascalCase (e.g., Feature)
- `asyncActions`: Array from --async argument

### Phase 2: Store Creation (30%)

Generate the Zustand store implementation:

```typescript
export const use{StoreName}Store = create<{StoreName}Store>()(
  {{#if persist}}
  persist(
  {{/if}}
    (set, get) => ({
      // INITIAL STATE
      items: [],
      selectedId: null,
      loading: false,
      error: null,

      // SYNCHRONOUS ACTIONS
      setItems: (items) => {
        console.log('[{StoreName}Store] setItems:', items.length);
        set({ items });
      },

      addItem: (item) => {
        console.log('[{StoreName}Store] addItem:', item.id);
        set((state) => ({
          items: [...state.items, item],
        }));
      },

      updateItem: (id, updates) => {
        console.log('[{StoreName}Store] updateItem:', id, updates);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      removeItem: (id) => {
        console.log('[{StoreName}Store] removeItem:', id);
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      setSelectedId: (id) => {
        console.log('[{StoreName}Store] setSelectedId:', id);
        set({ selectedId: id });
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => {
        if (error) {
          console.error('[{StoreName}Store] Error:', error);
        }
        set({ error });
      },

      reset: () => {
        console.log('[{StoreName}Store] reset');
        set({
          items: [],
          selectedId: null,
          loading: false,
          error: null,
        });
      },

      // COMPUTED SELECTORS
      getItemById: (id) => {
        return get().items.find((item) => item.id === id);
      },

      getSelectedItem: () => {
        const { selectedId } = get();
        return selectedId ? get().getItemById(selectedId) : undefined;
      },

      getItemCount: () => {
        return get().items.length;
      },
    }),
  {{#if persist}}
    {
      name: '{storeName}-storage',
      version: 1,
      // Optional: custom serialization for Sets, Maps, etc.
      // storage: createJSONStorage(() => localStorage),
    }
  )
  {{/if}}
);
```

### Phase 3: Optimistic Update Actions (30%)

For each async action specified in `--async`, generate optimistic update pattern:

```typescript
// Example: createFeature action
{{actionName}}: async (data: {ItemType}Input) => {
  try {
    console.log('[{StoreName}Store] {actionName} started');
    set({ error: null });

    // STEP 1: Optimistic UI update with temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempItem: {ItemType} = {
      id: tempId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    get().addItem(tempItem);
    console.log('[{StoreName}Store] Optimistic update with temp ID:', tempId);

    // STEP 2: Call API (replace with actual API call)
    // const response = await fetch('/api/{items}', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
    // const createdItem = await response.json();

    // TODO: Replace mock API call with real implementation
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
    const createdItem: {ItemType} = {
      ...tempItem,
      id: `real-${Date.now()}`, // Real ID from server
    };

    // STEP 3: Replace temp item with real item from server
    get().updateItem(tempId, createdItem);
    console.log('[{StoreName}Store] {actionName} completed:', createdItem.id);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to {actionName}';
    set({ error: errorMessage });
    console.error('[{StoreName}Store] {actionName} failed:', err);

    // TODO: Optionally roll back optimistic update on error
    // get().removeItem(tempId);

    throw err;
  }
},

// Example: deleteFeature action
deleteItem: async (id: string) => {
  try {
    console.log('[{StoreName}Store] deleteItem started:', id);
    set({ error: null });

    // STEP 1: Optimistic removal
    const itemToDelete = get().getItemById(id);
    get().removeItem(id);
    console.log('[{StoreName}Store] Optimistic removal:', id);

    // STEP 2: Call API
    // await fetch(`/api/{items}/${id}`, { method: 'DELETE' });

    // TODO: Replace mock API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log('[{StoreName}Store] deleteItem completed:', id);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete';
    set({ error: errorMessage });
    console.error('[{StoreName}Store] deleteItem failed:', err);

    // TODO: Optionally restore deleted item on error
    // if (itemToDelete) get().addItem(itemToDelete);

    throw err;
  }
},
```

**Async Action Patterns**:
- **Create**: temp ID → API call → replace temp with real
- **Update**: optimistic update → API call → confirm
- **Delete**: optimistic remove → API call → confirm (or rollback on error)

### Phase 4: Selectors & Export (20%)

Add computed selectors and export hooks:

```typescript
// Additional computed selectors based on domain
// Example: Filter by status
getActiveItems: () => {
  return get().items.filter((item) => item.status === 'active');
},

// Example: Search by name
searchItems: (query: string) => {
  return get().items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );
},

// Example: Sort by date
getItemsSortedByDate: () => {
  return [...get().items].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
},
```

## Output Message

After successful generation:

```
✅ Zustand store created successfully!

File created:
  - src/stores/{storeName}.ts

Store: use{StoreName}Store
Type: {ItemType}
Async actions: {asyncActionsList}
Persistence: {enabled/disabled}

Next steps:
1. Review and customize the {ItemType} interface with domain-specific properties
2. Update {ItemType}Input to match creation requirements
3. Replace TODO API calls with actual fetch/axios implementations
4. Add domain-specific selectors (filter, search, sort)
5. Import and use in components:

   import { use{StoreName}Store } from '@/stores/{storeName}';

   function MyComponent() {
     const { items, addItem, loading } = use{StoreName}Store();
     // ... use store
   }

6. Consider adding WebSocket listeners in route components for real-time sync
7. Run: npm run typecheck
```

## Error Handling

**Invalid store name**:
```
❌ Error: Store name must be camelCase (e.g., featureStore, not FeatureStore or feature-store)
```

**Store already exists**:
```
❌ Error: Store file already exists: src/stores/{storeName}.ts
Choose a different name or remove the existing store first.
```

**Invalid async action name**:
```
❌ Error: Async action names must be camelCase (e.g., createFeature, not CreateFeature)
Provided: {invalidAction}
```

## Best Practices

1. **Naming Conventions**:
   - Store: camelCase suffix with "Store" (featureStore, userPreferenceStore)
   - Items: Singular PascalCase (Feature, UserPreference)
   - Actions: camelCase verbs (createFeature, updateFeature, deleteFeature)

2. **Optimistic Updates**:
   - Always use temp IDs with unique identifiers
   - Log all optimistic updates for debugging
   - Consider rollback strategy for failed API calls
   - Test error scenarios thoroughly

3. **Persistence**:
   - Use `--persist` for user preferences, UI state
   - Don't persist for server-synced data (use WebSocket instead)
   - Add version number for schema migrations

4. **Selectors**:
   - Use `get()` to access current state in selectors
   - Keep selectors simple and focused
   - Memoize expensive computations outside store if needed

5. **WebSocket Integration**:
   - Subscribe to events in route components, not in stores
   - Call store actions from WebSocket handlers
   - Example:
     ```typescript
     useEffect(() => {
       websocketClient.on('feature:created', (data) => {
         useFeatureStore.getState().addItem(data);
       });
       return () => websocketClient.off('feature:created');
     }, []);
     ```

## Example Interactions

### Example 1: Basic Store
```bash
User: /store-pattern-generator featureStore

Claude: Creating Zustand store: featureStore
✅ Store created with synchronous actions only
```

### Example 2: Store with Async Actions
```bash
User: /store-pattern-generator notificationStore --async createNotification,markAsRead,deleteNotification

Claude: Creating Zustand store: notificationStore
Async actions: createNotification, markAsRead, deleteNotification
✅ Store created with optimistic update patterns
```

### Example 3: Persisted Store
```bash
User: /store-pattern-generator themeStore --persist

Claude: Creating Zustand store: themeStore
Persistence: enabled (localStorage)
✅ Store created with persist middleware
```

### Example 4: Full-Featured Store
```bash
User: /store-pattern-generator taskStore --async createTask,updateTask,deleteTask --persist

Claude: Creating Zustand store: taskStore
Async actions: createTask, updateTask, deleteTask
Persistence: enabled (localStorage)
✅ Store created with optimistic updates and persistence
```

## Pattern Reference

This command follows patterns from:
- `src/apps/embedded/stores/annotationStore.ts` - Optimistic updates
- `src/core/stores/modelStore.ts` - Basic store structure
- `src/apps/embedded/stores/viewPreferenceStore.ts` - Persistence

## Notes

- All stores use TypeScript strict mode
- Logging with `[StoreName]` prefix for debugging
- Error handling with try/catch in async actions
- Computed selectors use `get()` for current state access
- Optimistic updates improve perceived performance
- Temp IDs use timestamp + random string for uniqueness

## Related Commands

- Use `/react-flow-node-wizard` for nodes that display store data
- Use `/embedded-route-scaffolder` for routes that consume stores
- Consider WebSocket integration for real-time data sync