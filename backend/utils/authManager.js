const axios = require('axios');

let cachedToken = null;
let tokenExpiry = null;

async function getOracleBearerToken() {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    try {
        const credentials = Buffer.from(
            `${process.env.ORACLE_CLIENT_ID}:${process.env.ORACLE_CLIENT_SECRET}`
        ).toString('base64');

        const response = await axios.post(
            process.env.ORACLE_OAUTH_URL, 
            'grant_type=client_credentials', 
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        cachedToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; 

        console.log("Secure OAuth token acquired from Oracle Cloud.");
        return cachedToken;
    } catch (error) {
        console.error("OAuth token negotiation failed:", error.response?.data || error.message);
        throw new Error("Upstream Authorization Failure");
    }
}

module.exports = { getOracleBearerToken };