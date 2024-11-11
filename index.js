import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();



const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

// Use environment variables for Twilio credentials (recommended for security)
const accountSid = process.env.TWILIO_ACCOUNT_SID ;
const authToken = process.env.TWILIO_AUTH_TOKEN  ;
const client = twilio(accountSid, authToken);

const app = express();
app.use(bodyParser.json());

// Route to send SMS
app.post('/send-sms', (req, res) => {
    const phoneNumber = req.body.phoneNumber;

    // Check for valid phone number format (E.164)
    if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        return res.status(400).json({ message: 'Invalid phone number format.' });
    }

    const locationRequestLink = `https://seproject1234.netlify.app/request-location?phone=${encodeURIComponent(phoneNumber)}`;

    client.messages.create({
        body: `Please share your location: ${locationRequestLink}`,
        from: process.env.phoneno, // Your Twilio phone number
        to: phoneNumber
    })
    .then(message => {
        res.json({ message: 'SMS sent successfully!' });
    })
    .catch(error => {
        console.error("Twilio Error:", error.message);
        res.status(500).json({ message: 'Error sending SMS: ' + error.message });
    });
});

// Route to handle location sharing
app.get('/request-location', (req, res) => {
    res.send(`
        <h1>Share Your Location</h1>
        <button onclick="getLocation()">Share Location</button>
        <p id="location"></p>

        <script>
            function getLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        document.getElementById('location').textContent = 
                            'Latitude: ' + position.coords.latitude + ', Longitude: ' + position.coords.longitude;

                        fetch('/save-location', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                phone: '${req.query.phone}'
                            })
                        });
                    });
                } else {
                    document.getElementById('location').textContent = "Geolocation is not supported by this browser.";
                }
            }
        </script>
    `);
});

// Route to save location on the server
app.post('/save-location', (req, res) => {
    const { latitude, longitude, phone } = req.body;
    console.log(`Received location for phone ${phone}: Latitude = ${latitude}, Longitude = ${longitude}`);
    res.json({ message: 'Location received successfully!' });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
