import { useState, useEffect } from "react";
import { ethers } from 'ethers';
import Web3 from 'web3';
import CrossChainABI from '../contracts/artifacts/CrossChainSwap.json'
import { relayer, ChainName, CHAINS } from "@certusone/wormhole-sdk"
import TokenBridgeAbi from './json/TokenBridgeABI.json'
import { getEmitterAddressEth, parseSequenceFromLogEth, attestFromEth, tryNativeToHexString, getIsTransferCompletedEth } from "@certusone/wormhole-sdk";
import ERC20ABI from './json/ERC20ABI.json'


export async function sendTransferNative(from, to, recipient, amount, wrappedTokenAddress,UpdateWrapped) {

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    let recipientTX = null;

    if (wrappedTokenAddress === null || (wrappedTokenAddress === "0x0000000000000000000000000000000000000000") | (wrappedTokenAddress === undefined)) {
        const networkTokenAttestation = await attestFromEth(
            from.tokenBridgeAddress, // Token Bridge Address
            signer, //Private Key to sign and pay for TX + RPC Endpoint
            from.testToken //Token Address
        );

        const emitterAddr = getEmitterAddressEth(from.tokenBridgeAddress);
        const seq = parseSequenceFromLogEth(
            networkTokenAttestation,
            from.bridgeAddress
        );
        const vaaURL = `https://wormhole-v2-testnet-api.certus.one/v1/signed_vaa/${from.wormholeChainId}/${emitterAddr}/${seq}`;
        console.log("Searching for: ", vaaURL);
        let vaaBytes = await (await fetch(vaaURL)).json();
        while (!vaaBytes.vaaBytes) {
            console.log("VAA not found, retrying in 5s!");
            await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
            vaaBytes = await (await fetch(vaaURL)).json();
        }


        let targetSigner = new ethers.Wallet("e47eb7ab976d439097f5e8fc052e485d0a460721f78f071c40412b1e74a84d7a").connect(new ethers.providers.JsonRpcProvider(to.rpc));
        let targetTokenBridge = new ethers.Contract(to.tokenBridgeAddress, TokenBridgeAbi.abi, targetSigner);


        const completeTransferTx = await (await targetTokenBridge.createWrapped(Buffer.from(vaaBytes.vaaBytes, "base64"))).wait();

        let hexstring = tryNativeToHexString(from.testToken, from.wormholeChainId);
        let bytes = Buffer.from(hexstring, "hex");
        wrappedTokenAddress = await targetTokenBridge.wrappedAsset(from.wormholeChainId, bytes);
        await UpdateWrapped();
    }

    if (from.CrossChainSwap !== "old-method") {
        const FromContract = new ethers.Contract(from.CrossChainSwap, CrossChainABI.abi, signer)
        let web3 = new Web3(window.ethereum);
        const FromContract2 = new web3.eth.Contract(CrossChainABI.abi, from.CrossChainSwap).methods;

        const cost = await FromContract.quoteCrossChainDeposit(to.wormholeChainId);
        let costValue = Number(cost) + Number(amount);
        let gasLimitValue = (await web3.eth.getBlock("latest")).gasLimit;
        const tx = await FromContract.sendNativeCrossChainDeposit(to.wormholeChainId, to.CrossChainSwap, recipient, amount.toString(), from.wormholeChainId, window.ethereum.selectedAddress, { value: costValue.toString(), gasLimit: gasLimitValue.toString() });
        recipientTX = await tx.wait()

        await new Promise(resolve => setTimeout(resolve, 1000 * 15));

        const res = await getStatus(from.main_chain, recipientTX.transactionHash);
        // const res = await getStatus(from.main_chain, recipientTX);
        console.log(`Status: ${res.status}`);
        console.log(`Info: ${res.info}`);


    } else {
        const FromContract = new ethers.Contract(from.tokenBridgeAddress, TokenBridgeAbi.abi, signer)

        const targetRecepient = Buffer.from(tryNativeToHexString(recipient, to.wormholeChainId), "hex");

        const tx = await (
            await FromContract.wrapAndTransferETH(to.wormholeChainId, targetRecepient, 0, Math.floor(Math.random() * 1000000), {
                value: amount.toString()
            })
        ).wait();

        const emitterAddr = getEmitterAddressEth(from.tokenBridgeAddress);
        const seq = parseSequenceFromLogEth(tx, from.bridgeAddress); //Core Bridge
        const vaaURL = `https://wormhole-v2-testnet-api.certus.one/v1/signed_vaa/${from.wormholeChainId}/${emitterAddr}/${seq}`;
        let vaaBytes = await (await fetch(vaaURL)).json();

        console.log(vaaURL, vaaBytes);

        while (!vaaBytes.vaaBytes) {
            console.log("VAA not found, retrying in 5s!");
            await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
            vaaBytes = await (await fetch(vaaURL)).json();
        }

        let targetSigner = new ethers.Wallet("e47eb7ab976d439097f5e8fc052e485d0a460721f78f071c40412b1e74a84d7a").connect(new ethers.providers.JsonRpcProvider(to.rpc));
        let targetTokenBridge = new ethers.Contract(to.tokenBridgeAddress, TokenBridgeAbi.abi, targetSigner);


        recipientTX = await (await targetTokenBridge.completeTransfer(Buffer.from(vaaBytes.vaaBytes, "base64"))).wait();

        console.log("success!");


    }

    return recipientTX;
}
export async function sendTransfer(from, to, recipient, amount, selectedToken, wrappedTokenAddress,UpdateWrapped) {

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    let recipientTX = null;

    if (wrappedTokenAddress === null || (wrappedTokenAddress === "0x0000000000000000000000000000000000000000") | (wrappedTokenAddress === undefined)) {
        const networkTokenAttestation = await attestFromEth(
            from.tokenBridgeAddress, // Token Bridge Address
            signer, //Private Key to sign and pay for TX + RPC Endpoint
            selectedToken.testToken //Token Address
        );

        const emitterAddr = getEmitterAddressEth(from.tokenBridgeAddress);
        const seq = parseSequenceFromLogEth(
            networkTokenAttestation,
            from.bridgeAddress
        );
        const vaaURL = `https://wormhole-v2-testnet-api.certus.one/v1/signed_vaa/${from.wormholeChainId}/${emitterAddr}/${seq}`;
        console.log("Searching for: ", vaaURL);
        let vaaBytes = await (await fetch(vaaURL)).json();
        while (!vaaBytes.vaaBytes) {
            console.log("VAA not found, retrying in 5s!");
            await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
            vaaBytes = await (await fetch(vaaURL)).json();
        }


        let targetSigner = new ethers.Wallet("e47eb7ab976d439097f5e8fc052e485d0a460721f78f071c40412b1e74a84d7a").connect(new ethers.providers.JsonRpcProvider(to.rpc));
        let targetTokenBridge = new ethers.Contract(to.tokenBridgeAddress, TokenBridgeAbi.abi, targetSigner);


        const completeTransferTx = await (await targetTokenBridge.createWrapped(Buffer.from(vaaBytes.vaaBytes, "base64"))).wait();

        let hexstring = tryNativeToHexString(selectedToken.address, from.wormholeChainId);
        let bytes = Buffer.from(hexstring, "hex");
        wrappedTokenAddress = await targetTokenBridge.wrappedAsset(from.wormholeChainId, bytes);
        await UpdateWrapped();
    }

    if (from.CrossChainSwap !== "old-method") {
        

         let web3 = new Web3(window.ethereum);
         let gasLimitValue = (await web3.eth.getBlock("latest")).gasLimit;
         

        const TokenContract = new ethers.Contract(selectedToken.address, ERC20ABI.abi, signer)


       await ( await TokenContract.approve(from.CrossChainSwap,amount.toString())).wait();



        const FromContract = new ethers.Contract(from.CrossChainSwap, CrossChainABI.abi, signer)
        const cost = await FromContract.quoteCrossChainDeposit(to.wormholeChainId);
        let costValue = Number(cost);
       
        const tx = await FromContract.sendCrossChainDeposit(to.wormholeChainId, to.CrossChainSwap, recipient, amount.toString(), selectedToken.address, from.wormholeChainId, window.ethereum.selectedAddress, { value: costValue.toString(), gasLimit: gasLimitValue.toString() });
        recipientTX = await tx.wait()

        await new Promise(resolve => setTimeout(resolve, 1000 * 15));

        const res = await getStatus(from.main_chain, recipientTX.transactionHash);
        // const res = await getStatus(from.main_chain, recipientTX);
        console.log(`Status: ${res.status}`);
        console.log(`Info: ${res.info}`);


    } else {
        const FromContract = new ethers.Contract(from.tokenBridgeAddress, TokenBridgeAbi.abi, signer)

        const targetRecepient = Buffer.from(tryNativeToHexString(recipient, to.wormholeChainId), "hex");

        const tx = await (
            await FromContract.wrapAndTransferETH(to.wormholeChainId, targetRecepient, 0, Math.floor(Math.random() * 1000000), {
                value: amount.toString()
            })
        ).wait();

        const emitterAddr = getEmitterAddressEth(from.tokenBridgeAddress);
        const seq = parseSequenceFromLogEth(tx, from.bridgeAddress); //Core Bridge
        const vaaURL = `https://wormhole-v2-testnet-api.certus.one/v1/signed_vaa/${from.wormholeChainId}/${emitterAddr}/${seq}`;
        let vaaBytes = await (await fetch(vaaURL)).json();

        console.log(vaaURL, vaaBytes);

        while (!vaaBytes.vaaBytes) {
            console.log("VAA not found, retrying in 5s!");
            await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
            vaaBytes = await (await fetch(vaaURL)).json();
        }

        let targetSigner = new ethers.Wallet("e47eb7ab976d439097f5e8fc052e485d0a460721f78f071c40412b1e74a84d7a").connect(new ethers.providers.JsonRpcProvider(to.rpc));
        let targetTokenBridge = new ethers.Contract(to.tokenBridgeAddress, TokenBridgeAbi.abi, targetSigner);


        recipientTX = await (await targetTokenBridge.completeTransfer(Buffer.from(vaaBytes.vaaBytes, "base64"))).wait();

        console.log("success!");


    }

    return recipientTX;
}
export async function getStatus(sourceChain, transactionHash) {
    const info = await relayer.getWormholeRelayerInfo(sourceChain, transactionHash, { environment: "TESTNET" });
    const status = info.targetChainStatus.events[0].status;
    return { status, info: relayer.stringifyWormholeRelayerInfo(info) };
}