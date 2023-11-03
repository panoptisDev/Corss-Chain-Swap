

## Getting Started

First, run :

```bash
npm i
# or
yarn
```


Then, run the development server:

```bash
npm run dev
# or
yarn dev
```


**Diagram:** https://www.figma.com/file/TXeLJAL8Up83AewyTXkSix/Cross-Chain-Swap?type=whiteboard&node-id=0%3A1&t=pqP8dc4WfEhjI7Ub-1
![Diagram](https://i.postimg.cc/kGD8GTGc/Cross-Chain-Swap.jpg)


**How it works:** User first have to connect Metmask Wallet to continue. Then he has to choose a from and target network. After selecting he has to choose the Coin. For example he can choose ETH or USDT or Celo. Then he will see a wrapped token address. for example if he chooses ETH then target chain wrapped token will be WETH. User will receive WETH in target chain. Cross-Chain Swap uses Wormhole protocol to make this cross chain swap. 



**Technical Description:** We have integrated wormhole protocol in our website. For this we have deployed our smart contract in each chains for those chains has wormhole relayer. And for those chain which does not have wormhole relayer we are using off chain code. We have made this website from scratch. And we have built it in Next.js.


**Problem it solves:** Cross-chain swap solves several problems that exist in the current cryptocurrency ecosystem, such as:
-  It eliminates the need for centralized exchanges that charge high fees, impose strict regulations, and pose security risks for users who have to entrust their funds to a third party
<br/>
-  It enables the direct and trustless exchange of tokens between different blockchains, without relying on any intermediary or escrow service. Users can swap tokens in a peer-to-peer manner, with full control and ownership of their assets
<br/>
-  It enhances the **interoperability and innovation** of the blockchain ecosystem, as cross-chain swap enables the communication and collaboration between different blockchain networks and protocols.
<br/><br/>

**Security:**  Cross-chain swap also poses some security challenges, such as:
<br/>
-   How to ensure that the tokens are locked and unlocked correctly on both chains?<br/>
-   How to handle network failures or delays that may affect the swap process?<br/>
<br/>
To address these challenges, cross-chain swap protocols (Wormhole) use various mechanisms, such as:
<br/><br/>
-  **Hash Time Lock Contracts (HTLCs)**: These are smart contracts that lock the tokens on both chains until a secret random number is revealed by one of the parties. The secret number acts as a proof of payment and allows the other party to claim the tokens on the opposite chain.
<br/>

- **Relayers**: These are nodes that facilitate the communication and coordination between different blockchains. Relayers monitor the events on both chains and relay the necessary information to trigger the swap.


### Wormhole Code

```bash
/services/useTransfer.js
```




## Contact info:
### telegram:
https://t.me/Bahauddin1976

### Skype:
live:5385a714ad774375
