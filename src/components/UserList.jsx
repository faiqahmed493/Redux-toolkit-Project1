import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUsers } from '../features/userSlice';
import './UserList.css' 

function UserList() {

    // Fetching the users array from Redux state
    const {users, apiUsers, loading, error} = useSelector(state => state.users);

    console.log(users[0],loading,error);

    const dispatch = useDispatch();

    // dispatch(fetchUsers);

    console.log("api users",apiUsers)

    return (
        <>
    
        <div className="table-container">
            <h2>Registered Users</h2>
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Country</th>
                        <th>City</th>
                    </tr>
                </thead>
                <tbody>
                    
                    {users && users.length > 0 ? (
                        users.map((userItem, index) => (
                            /* The key belongs exclusively to the <tr> wrapper row */
                            <tr key={index}>
                                <td>{userItem.username}</td>
                                <td>{userItem.useremail}</td>
                                <td>{userItem.usercountry}</td>
                                <td>{userItem.usercity}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="no-data">No users added yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>  
        </div>

        {/* <button onClick={() => dispatch(fetchUsers())}> Fetch Users </button> */}

        <div className="fetch-container">
            <div className="fetch-header-action">
                <h2>External Database Connection</h2>
                <button 
                    className="fetch-btn"
                    onClick={() => dispatch(fetchUsers())}
                    disabled={loading} // Prevent double clicking while loading
                >
                    {loading ? 'Connecting...' : 'Fetch Users'}
                </button>
            </div>

            {/* 1. Loading State Panel */}
            {loading && (
                <div className="status-box loading-box">
                    <div className="spinner"></div>
                    <p>Retrieving user directories from API...</p>
                </div>
            )}

            {/* 2. Error State Panel */}
            {error && (
                <div className="status-box error-box">
                    <p><strong>Error:</strong> {error}</p>
                </div>
            )}

            {/* 3. Data Table Display (Shows when data exists and not loading) */}
            {!loading && apiUsers && apiUsers.length > 0 && (
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apiUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="id-column">#{user.id}</td>
                                <td><strong>{user.name}</strong></td>
                                <td><strong>{user.email}</strong></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        
        </>
    )
}

export default UserList