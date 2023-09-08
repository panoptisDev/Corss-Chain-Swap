import "./index.css";
import "./App.css";
import "./css/tailwind.css"
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { configureChains, goerli, WagmiConfig, createClient } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

import Header from '../components/components/Header'

const { provider, webSocketProvider } = configureChains(
  [goerli],
  [publicProvider()]
);

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
});


function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={client}>
    
      <Header />
      <div className="mainWindow" >
        <Component {...pageProps} />
      </div>
    </WagmiConfig>
  );
}

export default MyApp;
