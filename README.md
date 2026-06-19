# Redux Toolkit — Notes for This Project

This README is a personal reference. Every concept below is tied to the actual
file in this repo where it's used, so you can jump back and forth between the
explanation and the real code.

---

## 1. The Big Picture

Redux Toolkit (RTK) is the official, opinionated way to write Redux. Instead
of hand-writing action types, action creators, and reducers separately, RTK
gives you tools that generate all of that for you.

This project's Redux flow, end to end:

```
main.jsx
   └─ <Provider store={store}>          → makes the store available to the whole app
        └─ App.jsx
             ├─ Form.jsx        (dispatch)   → adds a user to local Redux state
             └─ UserList.jsx    (dispatch + select) → reads state, fetches from API
```

```
src/
├─ app/
│   └─ store.js          ← configureStore() — the single Redux store
└─ features/
    └─ userSlice.js       ← createSlice() + createAsyncThunk() — state + actions + reducers
```

---

## 2. `configureStore` — `src/app/store.js`

```js
import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../features/userSlice'

export const store = configureStore({
    reducer: {
        users: userReducer,
    }
})
```

- **What it replaces:** plain Redux's `createStore()`.
- **What it does for free:**
  - Combines multiple slice reducers into one root reducer (here, just `users`).
  - Wires in `redux-thunk` automatically, so `createAsyncThunk` (below) works
    out of the box — no manual middleware setup.
  - Enables Redux DevTools automatically.
- **Key mapping to remember:** the key `users` in the `reducer` object is the
  name under which this slice's state lives in the global store. That's why
  every `useSelector` in this app reads `state.users.*`.

---

## 3. `createSlice` — `src/features/userSlice.js`

```js
const userSlice = createSlice({
    name: 'users',
    initialState: {
        users: [],
        apiUsers: [],
        loading: false,
        error: null
    },
    reducers: {
        addUser: (state, action) => {
            state.users.push(action.payload);
        }
    },
    extraReducers: (builder) => { ... }
})
```

`createSlice` bundles three things that used to be written by hand:

| Piece | What it is here |
|---|---|
| `name` | `'users'` — used as a prefix for generated action types (e.g. `users/addUser`) |
| `initialState` | the starting shape of this slice's state |
| `reducers` | synchronous update logic — RTK auto-generates the matching action creator |

**`addUser` reducer:**
```js
addUser: (state, action) => {
    state.users.push(action.payload);
}
```
This *looks* like it's mutating `state` directly with `.push()` — normally
illegal in Redux, where reducers must be pure and never mutate state.
RTK secretly uses **Immer** under the hood inside `createSlice`, so this
"mutating" code is automatically translated into a safe, immutable update.
This is one of the biggest reasons RTK exists — it removes the boilerplate of
manual spread-copying (`{...state, users: [...state.users, action.payload]}`).

**Exports from a slice:**
```js
export const { addUser } = userSlice.actions;   // action creator, auto-generated
export default userSlice.reducer;                // the reducer, goes into the store
```

---

## 4. `createAsyncThunk` — handling API calls

```js
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    const data = response.json();   // ⚠️ see note below
    return data;
})
```

- `createAsyncThunk(typePrefix, payloadCreator)` wraps an async function
  (here, a `fetch` call) and automatically dispatches **three** lifecycle
  actions for you, based on the promise's state:

  | Action type | When it fires |
  |---|---|
  | `users/fetchUsers/pending` | the moment the thunk starts |
  | `users/fetchUsers/fulfilled` | the promise resolves — `action.payload` = the returned data |
  | `users/fetchUsers/rejected` | the promise throws — `action.error.message` = error text |

- You never dispatch these three manually — `dispatch(fetchUsers())` in
  `UserList.jsx` triggers the whole pending → fulfilled/rejected cycle.

> **Bug to fix:** `const data = response.json();` is missing `await`. This
> means `data` is currently a `Promise`, not the actual JSON. It should be:
> ```js
> const data = await response.json();
> ```

---

## 5. `extraReducers` — responding to thunk lifecycle actions

```js
extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
          state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
          state.loading = false;
          state.apiUsers = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message;
      })
}
```

- `reducers` (section 3) only handles actions defined *inside* the slice
  (`addUser`). It cannot reference action types from outside the slice.
- `extraReducers` is how a slice reacts to actions it doesn't own — like the
  three auto-generated thunk actions from `createAsyncThunk`.
- The **builder callback pattern** (`builder.addCase(...)`) is the modern,
  type-safe way to write this — used instead of an older object/switch-style
  map.
- This is exactly the pending/fulfilled/rejected pattern for a typical
  "loading → success/error" UI state machine, which you can see consumed
  directly in `UserList.jsx`'s `loading` and `error` conditional rendering.

---

## 6. Connecting React to the Store

### `Provider` — `src/main.jsx`
```jsx
<Provider store={store}>
  <App />
</Provider>
```
Makes the store available to every component in the tree via React Context.
Without this, `useSelector`/`useDispatch` would throw.

### `useDispatch` — sending actions
```js
// Form.jsx
const dispatch = useDispatch();
dispatch(addUser(user));        // synchronous action

// UserList.jsx
dispatch(fetchUsers());         // async thunk
```
`useDispatch()` gives you the `dispatch` function tied to the store from
`Provider`. Calling an action creator (`addUser(user)`) returns a plain
action object `{ type: 'users/addUser', payload: user }`; calling a thunk
(`fetchUsers()`) returns a function that RTK's thunk middleware knows how to
handle.

### `useSelector` — reading state
```js
// UserList.jsx
const { users, apiUsers, loading, error } = useSelector(state => state.users);
```
`useSelector` takes a function `(state) => ...` and returns whatever slice of
state you ask for. The component re-renders automatically whenever that
selected value changes. Note the path: `state.users` corresponds directly to
the `users:` key registered in `configureStore` (section 2).

---

## 7. Full Data Flow Example (adding a user)

1. User fills the form in `Form.jsx` and submits.
2. `dispatch(addUser({ username, useremail, usercountry, usercity }))` fires.
3. RTK's generated action `{ type: 'users/addUser', payload: {...} }` reaches
   the store.
4. `userSlice`'s `reducers.addUser` runs, pushing the new user into
   `state.users.users` (via Immer, safely).
5. The store's `users` slice changes → `UserList.jsx`'s `useSelector`
   detects the change → component re-renders → new row appears in the table.

## 8. Full Data Flow Example (fetching from API)

1. User clicks "Fetch Users" in `UserList.jsx` → `dispatch(fetchUsers())`.
2. `fetchUsers.pending` fires immediately → `state.users.loading = true` →
   spinner shows.
3. `fetch(...)` resolves with data.
4. `fetchUsers.fulfilled` fires with `action.payload` = the API response →
   `state.users.apiUsers = action.payload`, `loading = false`.
5. If the request fails instead, `fetchUsers.rejected` fires →
   `state.users.error = action.error.message`.

---

## 9. Quick Glossary

| Term | One-line meaning |
|---|---|
| **Store** | The single object holding the entire app's Redux state |
| **Slice** | A self-contained chunk of state + its reducers + actions, for one feature (`users`) |
| **Action** | A plain object describing "what happened": `{ type, payload }` |
| **Reducer** | A function that takes `(state, action)` and returns the next state |
| **Thunk** | A function (instead of a plain action) dispatched to handle async logic |
| **Immer** | The library RTK uses internally so "mutating" code in reducers is actually safe |
| **`Provider`** | React component that injects the store into context |
| **`useDispatch`** | Hook to get the `dispatch` function |
| **`useSelector`** | Hook to read a piece of state and subscribe to its changes |

---

## 10. Known Issues / Things to Clean Up

- `userSlice.js` imports `{ act } from 'react'` — unused, can be removed.
- `fetchUsers`'s payload creator is missing `await` before `response.json()`.
- `apiUsers` is being **replaced** (`= action.payload`) not appended on each
  fetch — intentional if "Fetch Users" should always show the latest snapshot,
  but worth double-checking against the commented-out `.push()` line.
