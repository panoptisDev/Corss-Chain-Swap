import React from "react";
import { Link } from "react-router-dom";
import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";


function Header() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });

  return (<>
 
    <header>
      <div className="leftH">
        <img src="/favicon.svg" alt="logo" className="logo" />
      </div>
      <div className="rightH">
        <div className="connectButton" onClick={connect}>
          {isConnected ? (address.slice(0, 4) + "..." + address.slice(38)) : "Connect"}
        </div>
      </div>
    </header> </>
  );
}

export default Header;
