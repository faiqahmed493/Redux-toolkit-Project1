import React, { useState } from 'react'
import './Form.css' // Import your styling file here
import { useDispatch } from 'react-redux'
import { addUser } from '../features/userSlice'

const Form = () => {
    const [names, setName] = useState("");
    const [email, setEmail] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");

    const dispatch = useDispatch();

    const handleSubmit = (e) => {
        e.preventDefault();

        const user = {
            username : names,
            useremail : email,
            usercountry : country,
            usercity : city
        }

        dispatch(addUser(user));

        // console.log(user);

        setName("");
        setEmail("");
        setCountry("");
        setCity("");
    }

    return (
        <div className="form-container">
            <div className="form-card">
                <h1>Hi! User</h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name :</label>
                        <input type="text" name="name" value={names} placeholder='enter your name...' onChange={(e) => {setName(e.target.value)}} />
                    </div>

                    <div className="form-group">
                        <label>Email :</label>
                        <input type="email" name="email" value={email} placeholder='enter your email...' onChange={(e) => {setEmail(e.target.value)}} />
                    </div>

                    <div className="form-group">
                        <label>Country :</label>
                        <input type="text" name="country" value={country} placeholder='enter your country...' onChange={(e) => {setCountry(e.target.value)}} />
                    </div>

                    <div className="form-group">
                        <label>City :</label>
                        <input type="text" name="city" value={city} placeholder='enter your city...' onChange={(e) => {setCity(e.target.value)}} />
                    </div>

                    <button type="submit" className="submit-btn">Submit</button>
                </form>
            </div>
        </div>
    )
}

export default Form