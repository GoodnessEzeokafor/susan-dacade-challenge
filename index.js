const contractSource = `
contract Market =

  record product = {
    id:int,
    name: string,
    price:int,
    purchased:bool,
    images:string,
    owner:address
    
    }
  
  
  record state = 
    {
      productLength : int,
      products : map(int, product)
    }
  
  entrypoint init() = 
    { products = {}, 
      productLength = 0}
  
    
  entrypoint getProductLength() : int = 
    state.productLength
  
  stateful entrypoint add_new_product(_name:string,_price:int, _images:string) =
    let product = {id=getProductLength() + 1, name=_name,price=_price, images=_images,purchased=false, owner=Call.caller}
    let index = getProductLength() + 1
    put(state{products[index] = product, productLength  = index})

  
  entrypoint get_product_by_index(index:int) : product = 
    switch(Map.lookup(index, state.products))
      None => abort("Product does not exist with this index")
      Some(x) => x  
  
  payable stateful entrypoint buy_product(_id:int)=
    let product = get_product_by_index(_id) // get the current product with the id
    
    let  _seller  = product.owner : address
    
    require(product.id > 0,abort("NOT A PRODUCT ID"))
    
    // require that there is enough AE in the transaction
    require(Call.value >= product.price,abort("You Don't Have Enough AE"))
    
    // require that the product has not been purchased
    
    require(!product.purchased,abort("PRODUCT ALREADY PURCHASED"))
    
    // require that the buyer is not the seller
    
    require(_seller != Call.caller,"SELLER CAN'T PURCHASE HIS ITEM")
    
    // transfer ownership
    
    //product.owner = Call.caller
    
    // mark as  purchased
    
    //product.purchased = true 
    
    // update the product
    let updated_product = {id=product.id, name=product.name, price=product.price, images=product.images, purchased=true, owner=Call.caller}
    
    put(state{products[_id] = updated_product})
    
    // sends the amount
    
    Chain.spend(_seller, Call.value) 
    
    
`
contractAddress = "ct_NkqdVZ56wDdTiLYz9rcSVLKLh1sAUYdYqKdz94MMEAf7jKNCt"
var client = null // client defuault null
var productListArr = [] // empty arr
var productListLength = 0 // empty product list lenghth


async function callStatic(func, args) {
    //Create a new contract instance that we can interact with
    const contract = await client.getContractInstance(contractSource, {contractAddress});
    //Make a call to get data of smart contract func, with specefied arguments
    // console.log("Contract : ", contract)
    const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
    //Make another call to decode the data received in first call
    // console.log("Called get found: ",  calledGet)
    const decodedGet = await calledGet.decode().catch(e => console.error(e));
    // console.log("catching errors : ", decodedGet)
    return decodedGet;
  }
  
  //Create a asynchronous write call for our smart contract
  async function contractCall(func, args, value) {
    // client = await Ae.Aepp()
    // console.log(`calling a function on a deployed contract with func: ${func}, args: ${args} and options:`, value)
    // return client.contractCall(contractAddress, 'sophia-address', contractAddress, func, { args, value })
  
    // client = await Ae.Aepp();
    const contract = await client.getContractInstance(contractSource, {contractAddress});
    console.log("Contract:", contract)
    //Make a call to write smart contract func, with aeon value input
    // const calledSet = await contract.call(func, args, {amount:value}).catch(e => console.error(e));
    const calledSet = await contract.call(func, args, {amount:value}).catch(e => console.error(e));
    console.log("CalledSet", calledSet)
    return calledSet;
  }


  function renderProductList(){
    let template = $('#template').html();
    Mustache.parse(template);
    var rendered = Mustache.render(template, {productListArr});
    $("#productListBody").html(rendered);
    console.log("Mustashe Template Display")
  }
  


// loading
window.addEventListener('load', async() => {
    $("#loader").show();
  
    client = await Ae.Aepp();
  
    productListLength = await callStatic('getProductLength',[]);
    
    console.log('Number Of Products: ', productListLength);
  
    for(let i = 1; i < productListLength + 1; i++){
      const getProductList = await callStatic('get_product_by_index', [i]);
      productListArr.push({
        index_counter:i,
        name:getProductList.name,
        id:getProductList.id,
        price:getProductList.price,
        url:getProductList.images,
        purchased:getProductList.purchased
      })
    }
    renderProductList();  
    $("#loader").hide();
  });

