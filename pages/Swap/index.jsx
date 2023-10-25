import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  SwapOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import NetworkList from "../NetworkList.json";
import { ethers } from 'ethers';
import { sendTransferNative, sendTransfer } from '../../services/useTransfer'
import { useSendTransaction, useWaitForTransaction } from "wagmi";
import { erc20ABI } from "wagmi";
import TokenBridgeAbi from '../json/TokenBridgeABI.json';
import { tryNativeToHexString } from "@certusone/wormhole-sdk";

import { MetaMaskConnector } from "wagmi/connectors/metaMask";

import { useConnect, useAccount } from "wagmi";
function Swap() {

  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5);
  const [AvailableBalance, setAvailableBalance] = useState(0);
  const [Amount, setAmount] = useState(0);
  const [DestinationAddress, setDestinationAddress] = useState("");
  const [NetworkOne, setNetworkOne] = useState(NetworkList[1]);
  const [NetworkTwo, setNetworkTwo] = useState(NetworkList[2]);
  const [SelectTokens, setSelectTokens] = useState(NetworkOne.tokens);
  const [SelectedToken, setSelectedToken] = useState(NetworkList[1].tokens[0]);
  const [WrappedToken, setWrappedToken] = useState("...");
  const [WrappedTokenName, setWrappedTokenName] = useState("");
  const [WrappedTokenSymbol, setWrappedTokenSymbol] = useState("");
  const [isOpenNetwork, setIsOpenNetwork] = useState(false);
  const [isOpenToken, setIsOpenToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [changeNetwork, setChangeNetwork] = useState(1);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null,
  });
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });
  async function sendTransaction() {
    setIsLoading(true);
    setIsSuccess(false);
    setTxDetails({
      to: DestinationAddress
    })
    try {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${NetworkOne.chainId.toString(16)}` }], // chainId must be in hexadecimal numbers
        });
      } catch (e) { }
      await connect()
      if (SelectedToken.address == "native") {

        await sendTransferNative(NetworkOne, NetworkTwo, DestinationAddress, Amount * 1e18, WrappedToken, UpdateWrapped)
      } else {
        await sendTransfer(NetworkOne, NetworkTwo, DestinationAddress, Amount * 1e18, SelectedToken, WrappedToken, UpdateWrapped)
      }
      setIsLoading(false);
      setIsSuccess(true);

      resetAll()

    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setIsSuccess(false);
    }

  }
  function resetAll(){
    UpdateBlanace()
    setAmount(0)
    setDestinationAddress("")
  }

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }
  async function changeNetworkMetamask(Network) {
    // Check if MetaMask is installed
    // MetaMask injects the global API into window.ethereum
    if (window.ethereum) {
      try {
        // check if the chain to connect to is installed
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${Network.chainId.toString(16)}` }], // chainId must be in hexadecimal numbers
        });
      } catch (error) {
        // This error code indicates that the chain has not been added to MetaMask
        // if it is not, then install it into the user MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${Network.chainId.toString(16)}`,
                  chainName: Network.title,
                  rpcUrl: Network.rpc,
                  blockExplorerUrl: Network.explorer,
                },
              ],
            });
          } catch (addError) { }
        }
      }
    } else {
      messageApi.open({
        type: 'error',
        content: 'MetaMask is not installed. Please consider installing it: https://metamask.io/download.html',
      });
    }
    await connect()
  }
  async function AddWrappedToken() {

    await changeNetworkMetamask(NetworkTwo)

    // Use wallet_watchAsset
    await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: WrappedToken,
          symbol: WrappedTokenSymbol,
          decimals: 18

        },
      },
    })
    messageApi.open({
      type: 'success',
      content: `${WrappedTokenSymbol} added to Metamask!`,
      duration: 2,
    });
  }
  async function UpdateWrapped() {

    const targetNetwork = NetworkTwo;


    let targetProvider = new ethers.providers.JsonRpcProvider(targetNetwork.rpc);
    const targetTokenBridgeWithoutSigner = new ethers.Contract(targetNetwork.tokenBridgeAddress, TokenBridgeAbi.abi, targetProvider);
    if (SelectedToken.address == "native") {
      let hexstring = tryNativeToHexString(NetworkOne.testToken, NetworkOne.wormholeChainId);
      let bytes = Buffer.from(hexstring, "hex");
      let wrappedTokenAddress = await targetTokenBridgeWithoutSigner.wrappedAsset(NetworkOne.wormholeChainId, bytes);
      setWrappedToken(wrappedTokenAddress)

      const provider = new ethers.providers.JsonRpcProvider(NetworkTwo.rpc);

      const contract = new ethers.Contract(
        wrappedTokenAddress,
        erc20ABI,
        provider
      );
      let symbol_name = "";
      try {
        symbol_name = await contract.symbol()
      } catch (error) {

      }
      setWrappedTokenSymbol(symbol_name);
      if (symbol_name != "") {
        setWrappedTokenName(`( ${symbol_name} )`);
      } else {
        setWrappedTokenName(``);
      }
    } else {
      let hexstring = tryNativeToHexString(SelectedToken.address, NetworkOne.wormholeChainId);
      let bytes = Buffer.from(hexstring, "hex");
      let wrappedTokenAddress = await targetTokenBridgeWithoutSigner.wrappedAsset(NetworkOne.wormholeChainId, bytes);
      setWrappedToken(wrappedTokenAddress)

      const provider = new ethers.providers.JsonRpcProvider(NetworkTwo.rpc);

      const contract = new ethers.Contract(
        wrappedTokenAddress,
        erc20ABI,
        provider
      );
      let symbol_name = "";
      try {
        symbol_name = await contract.symbol()
      } catch (error) {

      }
      setWrappedTokenSymbol(symbol_name);
      if (symbol_name != "") {
        setWrappedTokenName(`( ${symbol_name} )`);
      } else {
        setWrappedTokenName(``);
      }
    }

  }

  async function AddAsset() {
    await changeNetworkMetamask(NetworkOne)

    // Use wallet_watchAsset
    await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: SelectedToken.address,
          symbol: SelectedToken.name,
          decimals: SelectedToken.decimals

        },
      },
    })
    messageApi.open({
      type: 'success',
      content: `${SelectedToken.name} added to Metamask!`,
      duration: 2,
    });
  }

  async function UpdateBlanace() {
    if (address == null) {
      setAvailableBalance("0");
      return;
    }
    const provider = new ethers.providers.JsonRpcProvider(NetworkOne.rpc);
    if (SelectedToken.address == "native") {
      const balance = await provider.getBalance(address);
      let balanceInEth = Number(ethers.utils.formatEther(balance));
      balanceInEth = balanceInEth == 0 ? "0.00" : balanceInEth;
      setAvailableBalance(balanceInEth);
    } else {
      const contract = new ethers.Contract(
        SelectedToken.address,
        erc20ABI,
        provider
      );
      let balance = 0.00;
      try {
        balance = Number(ethers.utils.formatEther(await contract.balanceOf(address)));
      } catch (e) {
      }
      balance = balance == 0 ? "0.00" : balance;
      setAvailableBalance(balance);
    }

  }

  function switchNetworks() {
    const one = NetworkOne;
    const two = NetworkTwo;
    setNetworkOne(two);
    setSelectTokens(two.tokens);
    setSelectedToken(two.tokens[0])
    setNetworkTwo(one);
  }

  function openModalNetwork(network) {
    setChangeNetwork(network);
    setIsOpenNetwork(true);
  }

  function modifyNetwork(i) {
    if (changeNetwork === 1) {
      setNetworkOne(NetworkList[i]);
      setSelectedToken(NetworkList[i].tokens[0]);
      setSelectTokens(NetworkList[i].tokens);


    } else {
      setNetworkTwo(NetworkList[i]);
    }
    setIsOpenNetwork(false);
  }

  function modifyToken(active, i) {
    if (!active) return;
    setSelectedToken(NetworkOne.tokens[i]);


    setIsOpenToken(false);
  }

  useEffect(() => {
    UpdateWrapped();
  }, [NetworkOne, NetworkTwo])

  useEffect(() => {
    UpdateBlanace();
    UpdateWrapped();
  }, [SelectedToken, address])

  useEffect(() => {

    messageApi.destroy();

    if (isLoading) {
      messageApi.open({
        type: 'loading',
        content: 'Transaction is Pending...',
        duration: 0,
      })
    }

  }, [isLoading])

  useEffect(() => {
    messageApi.destroy();
    if (isSuccess) {
      messageApi.open({
        type: 'success',
        content: 'Transaction Successful',
        duration: 3,
      })
    } else if (txDetails.to) {
      messageApi.open({
        type: 'error',
        content: 'Transaction Failed',
        duration: 1.50,
      })
    }
  }, [isSuccess])


  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={1}>1%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
    <>
      <head>
        <title>Cross Chain Swap</title>
      </head>
      {contextHolder}
      <Modal
        open={isOpenNetwork}
        footer={null}
        onCancel={() => setIsOpenNetwork(false)}
        title="Select a Network"
      >
        <div className="modalContent">
          {NetworkList?.map((e, i) => {
            if (changeNetwork == 2 && NetworkOne == e) return <></>;
            if (changeNetwork == 1 && NetworkTwo == e) return <></>;

            return (
              <div
                className="tokenChoice"
                key={i}
                disabled={!e.active}
                onClick={() => modifyNetwork(i)}
              >
                <img src={e.img} alt={e.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <Modal
        open={isOpenToken}
        footer={null}
        onCancel={() => setIsOpenToken(false)}
        title="Select a Token"
      >
        <div className="modalContent">
          {SelectTokens?.map((e, i) => {
            return (
              <div
                disabled={!e.active}
                className="tokenChoice"
                key={i}
                onClick={() => modifyToken(e.active, i)}
              >
                <img src={e.img} alt={e.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>


      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4 className="font-bold text-white bg-red-500 border-0 badge badge-primary">Testnet</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs horizantal">

          <div className="bg-neutral small w-full rounded-lg py-2 px-5 relative">
            <div>
              <label className="block text-left text-xs">From</label>
              <div className="assetOne" onClick={() => openModalNetwork(1)}>
                <img src={NetworkOne.img} alt="assetOneLogo" className="assetLogo" />
                {NetworkOne.title}
                <DownOutlined />
              </div>
            </div>
          </div>


          <div className="switchButton" onClick={switchNetworks}>
            <SwapOutlined className="switchArrow" />
          </div>

          <div className="bg-neutral small w-full rounded-lg py-2 px-5 relative">
            <div>
              <label className="block text-left text-xs">To</label>
              <div className="assetTwo" onClick={() => openModalNetwork(2)}>
                <img src={NetworkTwo.img} alt="assetOneLogo" className="assetLogo" />
                {NetworkTwo.title}
                <DownOutlined />
              </div>
            </div>
          </div>
        </div>
        <div className="inputs horizantal mt-8">

          <div className="bg-neutral large w-full rounded-lg py-2 px-5 relative">
            <div>
              <div className="flex justify-between">
                <label className="block text-left text-xs">
                  I want to transfer from Ethereum
                </label>
                <div className="flex items-center">
                  {SelectedToken.address != "native" ? <><div
                    className=" dropdown tooltip tooltip-warning dropdown-end"
                    data-tip={"Add " + SelectedToken.name + " to Metamask"}
                   

                  >
                    <label
                      tabIndex={0}
                      className="flex items-center mr-2 btn btn-info btn-xs gap-x-2"
                    >
                      <span className="font-normal" style={{ fontSize: 10 }}>
                        Add Asset
                      </span>
                      <img
                        alt="metamask logo"
                        loading="eager"
                        width={20}
                        height={20}
                        decoding="async"
                        data-nimg={1}
                        src="https://img.icons8.com/color/250/metamask-logo.png"
                        style={{ color: "transparent" }}
                      />
                    </label>
                    <ul
                      tabIndex={0}
                      className="w-32 p-1 rounded-lg shadow-lg dropdown-content menu"
                      style={{ backgroundColor: "rgb(22, 33, 46)" }}
                      onClick={AddAsset}
                    >
                      <li role="button">
                        <span>
                          <img
                            alt="eth-wei"
                            loading="eager"
                            width={20}
                            height={20}
                            decoding="async"
                            data-nimg={1}
                            src={SelectedToken.img}
                            style={{ color: "transparent" }}
                          />
                          <img
                            alt="switch-arrow"
                            loading="lazy"
                            width={20}
                            height={20}
                            decoding="async"
                            data-nimg={1}
                            src="https://img.icons8.com/fluency/96/right.png"
                            style={{ color: "transparent" }}
                          />
                          <img
                            alt="chain"
                            loading="eager"
                            width={20}
                            height={20}
                            decoding="async"
                            data-nimg={1}
                            src={NetworkOne.img}
                            style={{ color: "transparent" }}
                          />
                        </span>
                      </li>
                    </ul>
                  </div></> : <></>}

                  <button className="btn btn-info btn-xs" onClick={() => { setAmount(AvailableBalance) }}>Max</button>
                </div>
              </div>

              <div className="asset-text">
                <div className="asset" onClick={() => setIsOpenToken(true)}>
                  <img src={SelectedToken.img} alt="assetOneLogo" className="assetLogo" />
                  {SelectedToken.ticker}
                  <DownOutlined />
                </div>
                <div className="text-end">
                  <input
                    className="text-lg font-bold text-right bg-transparent outline-none"
                    type="number"
                    placeholder={0}
                    value={Amount}

                    onInput={(e) => { setAmount(e.target.value); if (e.target.value > AvailableBalance) setAmount(AvailableBalance); if (e.target.value < 0) setAmount(0); }} />
                  <div className="space-y-1">
                    <div className="flex justify-end space-x-2">
                      <span className="text-xs text-gray-500">Available Balance:</span>
                      <span className="w-auto text-xs min-w-[20px] flex justify-end text-[#86d6ff]">
                        {AvailableBalance}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>


        </div>
        <div className="inputs horizantal mt-8">

          <div className="bg-neutral large w-full rounded-lg py-2 px-5 relative">
            <div>
              <div className="flex justify-between">
                <label className="block text-left text-xs">
                  Wrapped Token
                </label>
                <div className="flex items-center">
                  <div
                    className="  tooltip tooltip-warning "
                    data-tip={`Add ${WrappedTokenSymbol} to Metamask`}
                    onClick={() => { AddWrappedToken() }}
                  >
                    <label
                      tabIndex={0}
                      className="flex items-center mr-2 btn btn-info btn-xs gap-x-2"
                    >
                      <span className="font-normal" style={{ fontSize: 10 }}>
                        Add Asset
                      </span>
                      <img
                        alt="metamask logo"
                        loading="eager"
                        width={20}
                        height={20}
                        decoding="async"
                        data-nimg={1}
                        src="https://img.icons8.com/color/250/metamask-logo.png"
                        style={{ color: "transparent" }}
                      />
                    </label>

                  </div>
                </div>
              </div>
              <div className="asset-text text-left">
                <a href={NetworkTwo.explorer + "address/" + WrappedToken} className="text-[#86d6ff] underline" target="_blank" rel="noopener noreferrer">
                  {WrappedToken} {WrappedTokenName}
                </a>

              </div>

            </div>
          </div>


        </div>
        <div className="inputs mt-8 w-full">
          <div className="flex gap-3 relative rounded-lg w-full">
            <input
              className="bg-neutral font-bold input w-full"
              type="text"
              placeholder="Destination Address"
              value={DestinationAddress}
              onInput={(e) => { setDestinationAddress(e.target.value) }}
            />
            <div className="">
              <div
                className="animate__animated animate__pulse bg-gradient-to-b cursor-pointer from-[#E8821E] group h-full p-[1px] rounded-lg to-[#F89C35] w-28"
                role="button"
              >
                <div className="flex justify-around items-center h-full w-full bg-[#291e14] rounded-lg p-3" onClick={() => { setDestinationAddress(address) }}>
                  <div className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-b from-[#E8821E] to-[#F89C35]">
                    Fill with
                  </div>
                  <div className="relative flex items-center h-full ">
                    <img
                      alt="metaMask"
                      loading="lazy"
                      width={25}
                      height={25}
                      decoding="async"
                      data-nimg={1}
                      className="duration-200 group-hover:-translate-y-1"
                      src="https://img.icons8.com/color/250/metamask-logo.png"
                      style={{ color: "transparent" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="swapButton mt-8" onClick={sendTransaction} disabled={DestinationAddress === "" || !(Amount > 0) || !isConnected || isLoading} >
          {WrappedToken === "0x0000000000000000000000000000000000000000" ? "Attest Token & Swap" : "Swap"}
        </div>
      </div>
    </>
  );
}

export default Swap;
