const axios = require('axios');
const nikemodule = require('./nikegb-module');
const discord = require('discord.js')
const colors = require('colors');
const sql = require('mysql');

var config = {
	user: 'USERNAME',
	password: 'PASSWORD',
	server: 'SERVER',
	database: 'DATABASE',
	port: PORT
};

var con = sql.createConnection(config);

// run script every 3 seconds
setInterval(() => {
	(async() => {
		const response = await axios.get(nikemodule.api);
		// to check if object in api contains "productInfo"
		for(obj of response.data.objects) {
			if(obj.productInfo) {
				// if object contains multiple products
				if(obj.publishedContent.properties.threadType == 'multi_product') {
					obj.productInfo.forEach((product) => {
						
						if (product.hasOwnProperty('launchView')=== false) {
							return;
						  }
						

						console.log("MULTI PRODUCT")
						let type = "single product"
						let name = (obj.publishedContent.properties.seo.title).replace("Release Date", "").toLowerCase()
						let cw = (product.productContent.colorDescription).toLowerCase()
						let image = product.imageUrls.productImageUrl
						let price = product.merchPrice.currentPrice + " £"
						let sku = (product.merchProduct.styleColor).toLowerCase()
						let ea = product.merchProduct.exclusiveAccess
						let url = ("https://www.nike.com/gb/launch/t/") + obj.publishedContent.properties.seo.slug
							// if productInfo has "launchView" as property is true check if it contains a method
							// if it does, let "lm" be the method found
						var stock = ((product.skus).length)
						var sizes = [];
						var i;
						for(i = 0; i < stock; i++) {
							sizes.push(product.skus[i].nikeSize)
						}
						var sizelist = sizes.join('\n')
						if(product.hasOwnProperty('launchView') == true) {
							var lt = (product.launchView.startEntryDate).replace("T", " ").replace("Z", " ") + " +2h"
							if(product.launchView.hasOwnProperty('method') == true) {
								var lm = (product.launchView.method).toLowerCase()
							} else {
								var lm = "n/a"
							}
						}
						createProductData(name, image, price, sku, lm, cw, lt, sizelist, ea, url, type);
					})
				}
				else if(obj.publishedContent.properties.threadType == 'product') {
					obj.productInfo.forEach((product) => {

						if (product.hasOwnProperty('launchView') === false) {
							return;
						  }

						let type = "single product"
						let name = (obj.publishedContent.properties.seo.title).replace("Release Date", "").toLowerCase()
						let cw = (product.productContent.colorDescription).toLowerCase()
						let image = product.imageUrls.productImageUrl
						let price = product.merchPrice.currentPrice + " £"
						let sku = (product.merchProduct.styleColor).toLowerCase()
						let ea = product.merchProduct.exclusiveAccess
						let url = ("https://www.nike.com/gb/launch/t/") + obj.publishedContent.properties.seo.slug
							// if productInfo has "launchView" as property is true check if it contains a method
							// if it does, let "lm" be the method found
						var stock = ((product.skus).length)
						var sizes = [];
						var i;
						for(i = 0; i < stock; i++) {
							sizes.push(product.skus[i].nikeSize)
						}
						var sizelist = sizes.join('\n')
						if(product.hasOwnProperty('launchView') == true) {
							var lt = (product.launchView.startEntryDate).replace("T", " ").replace("Z", " ")
							if(product.launchView.hasOwnProperty('method') == true) {
								var lm = (product.launchView.method).toLowerCase()
							} else {
								var lm = "n/a"
							}
						}
						
						createProductData(name, image, price, sku, lm, cw, lt, sizelist, ea, url, type);
					})
				}
			}
		}
	})();
	
	function createProductData(name, image, price, sku, lm, cw, lt, sizelist, ea, url, type) {
		let product = {
			name: name,
			image: image,
			price: price,
			sku: sku,
			lm: lm,
			cw: cw,
			lt: lt,
			sizelist: sizelist,
			exclusiveAccess: ea,
			url: url,
			type: type
		};
	
		console.table(product)
		
		con.query('SELECT * FROM `DATABASE`.`snkrs-gb` WHERE `sku` = ? AND `timestamp` = ?', [sku, lt], function (err, recordset) {
	
			if (err) console.log(err)
			if (!recordset.length){
	
				con.query('INSERT INTO `DATABASE`.`snkrs-gb`(`sku`,`timestamp`,`name`)VALUES(?,?,?);',[
					sku,
					lt,
					name
				], function (err, recordset) {
			
					if (err) console.log(err)
					// send records as a response
				
				});

				const embed = new discord.WebhookClient("742333612824854548", "-GHHQ5uSWivLbLHmUDq6l4a9k2CrR0Zn9PJPyAS0DU3dT-lwMhTEFuk1cS4sfBIaNxNo")
		embed.send({
			"embeds": [{
				"title": `${product.name}`,
				"description": "new product added.",
				"url": `${product.url}`,
				"color": 5974249,
				"fields": [{
					"name": "price:",
					"value": `${product.price}`,
					"inline": true
				}, {
					"name": "sku:",
					"value": `||${product.sku}||`,
					"inline": true
				}, {
					"name": "drop method:",
					"value": `||${product.lm}||`,
					"inline": true
				}, {
					"name": "date:",
					"value": `${product.lt}`
				}, {
					"name": "sizes:",
					"value": `${product.sizelist}`
				}, {
					"name": "colorway:",
					"value": `${product.cw}`
				},
				],
				"author": {
					"name": `exclusive access: ${product.exclusiveAccess}`
				},
				"footer": {
					"text": "nike snkrs monitor made by @washedludwig, #ludwig0808"
				},
				"thumbnail": {
					"url": `${image}`
				}
			}]
		})
			}
			else {
				console.log(`duplicate... not sending webhook: ${name}` + new Date())
			}
			
		
		})
	
	
	}

}, 3000);

