/* eslint-disable max-len */
// Import the page's CSS. Webpack will know what to do with it.
import '../stylesheets/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import ecommerceStoreArtifacts from '../../build/contracts/EcommerceStore.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var EcommerceStore = contract(ecommerceStoreArtifacts)

window.App = {
  start: function () {
    var self = this

    // Bootstrap the MetaCoin abstraction for Use.
    EcommerceStore.setProvider(web3.currentProvider)

    if ($('#product-details').length > 0) {
      const productId = new URLSearchParams(window.location.search).get('id')
      renderProductDetails(productId)
    } else {
      renderStore()
    }

    $('#add-item-to-store').submit((event) => {
      event.preventDefault()

      const request = $('#add-item-to-store').serialize()
      const jsonData = `{ "${request.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"')}" }`
      console.log(jsonData)
      const params = JSON.parse(jsonData)

      const decodedParams = {}
      Object.keys(params).forEach((key) => {
        decodedParams[key] = decodeURIComponent(decodeURI(params[key]))
      })

      // console.log('params:', params);
      console.log(decodedParams);
      saveProduct(decodedParams)
    })

    $('#buy-now').submit((event) => {
      event.preventDefault()

      $('#msg').hide()

      const sendAmount = $('#buy-now-price').val()
      const productId = $('#product-id').val()

      console.log(`Buying productId ${productId} for ${sendAmount}`);

      EcommerceStore.deployed()
        .then((f) => {
          f.buy(productId, {
            value: web3.toWei(sendAmount),
            from: web3.eth.accounts[0],
            gas: 440000
          })
        }).then(() => {
          $('#msg').html(`Product was successfully purchased.`).show()
        })
    })
  }
}

function saveProduct (product) {
  EcommerceStore.deployed()
    .then((f) => {
      return f.addProductToStore(
        product['product-name'],
        product['product-category'],
        'imageLink',
        'descLink',
        Date.parse(product['product-start-time']) / 1000,
        web3.toWei(product['product-price'], 'ether'),
        product['product-condition'],
        {
          from: web3.eth.accounts[0],
          gas: 4700000,
        }
      )
    })
    .then((f) => {
      console.log(`Product "${product['product-name']}" added to store.`)
    })
}

function renderProductDetails(productId) {
  console.log('renderProductDetails::productId', productId);

  EcommerceStore.deployed()
    .then((f) => {
      f.getProduct.call(productId).then((product) => {
        $('#product-name').html(product[1])
        $('#product-price').html(displayPrice(product[6]))
        $('#product-id').val(product[0])
        $('#buy-now-price').val(web3.fromWei(product[6], 'ether'))
      })
    })
}

function renderStore () {
  var instance
  EcommerceStore.deployed()
    .then((f) => {
      instance = f
      return instance.productIndex.call()
    })
    .then((count) => {
      for (var i = 1; i <= count; i++) {
        renderProduct(instance, i)
      }
    })
}

function renderProduct (instance, productId) {
  instance.getProduct.call(productId).then((product) => {
    const node = $('<div />')
    console.log(product);
    node.addClass('col-sm-3 text-center col-margin-bottom-1 product')
    node.append(`<div class="title">${product[1]}</div>`)
    node.append(`<div class="">${displayPrice(product[6])}</div>`)
    node.append(`<a href="product.html?id=${product[0]}">Detail</a>`)

    // Check if product was bought already
    if (product[8] === '0x0000000000000000000000000000000000000000') {
      $('#product-list').append(node)
    } else {
      $('#product-purchased').append(node)
    }
  })
}

function displayPrice (amount) {
  return `&Xi; ${web3.fromWei(amount, 'ether')}`
}

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    // You have to select local server in Metamask!
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
  }

  window.App.start()
})
