var EcommerceStore = artifacts.require("./EcommerceStore.sol");

module.exports = function(deployer) {
  deployer.deploy(EcommerceStore, web3.eth.accounts[9]);
};
