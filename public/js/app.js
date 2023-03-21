// The Auth0 client, initialized in configureClient()
let auth0Client = null;

/**
 * Starts the authentication flow
 */


const login = async (targetUrl) => {
  try {
    console.log("Logging in", targetUrl);

    const options = {
      authorizationParams: {
        redirect_uri: window.location.origin,
        transaction_input: "{'chicken nuggets': 'lol'}" // not custom button
      }
    };


    await auth0Client.loginWithRedirect(options);

    
  } catch (err) {
    console.log("Log in failed", err);
  }
};



const sendTransaction = async () => { 
  try {

    let options
    let accessToken
    let idToken

    // send auth0 a request for adding custom claims to JWT (this is just a update db req)
    console.log('Request claims in JWT')
    options = { // Should I code UUID on auth0 or client side (I now think client becuase of the log in gets a req add error handle ?)
      authorizationParams: {
        transaction_input: JSON.stringify({


          // // init JWT
          // othentFunction: "initializeContract", 
          // warpData: {function: 'initializeContract', data: null},


          // send txn for warp (blog)
          othentFunction: "broadcastTxn",
          warpData: {
            function: 'broadcastTxn', 
            data: {
              toContractId: 'XL_AtkccUxD45_Be76Qe_lSt8q9amgEO9OQnhIo-2xI',
              toContractFunction: 'createPost',
              txnData: {blog_post_1: 'Hello World!'}
            }
          },



          // arweave TXN
          // here


          nonce: 1234 // figure out later maybe IAT u see
      })
      }
    };
    await auth0Client.loginWithPopup(options);


    // This is the actual request to send the transaction
    console.log('Get the JWT to send to warp');
    accessToken = await auth0Client.getTokenSilently({
      detailedResponse: true
    });
    idToken = accessToken.id_token;
    console.log(idToken)
    idToken = jwt_decode(idToken)
    console.log(idToken);

  }
  catch (err) {
    console.log(err)
  }
}





/**
 * Executes the logout flow
 */
const logout = async () => {
  try {
    console.log("Logging out");
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("/auth_config.json");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0Client = await auth0.createAuth0Client({
    domain: config.domain,
    clientId: config.clientId
  });
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

// Will run when page finishes loading
window.onload = async () => {
  await configureClient();

  // If unable to parse the history hash, default to the root URL
  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  // Listen out for clicks on any hyperlink that navigates to a #/ URL
  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    }
  });

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0Client.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }

      console.log("Logged in!");
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};
