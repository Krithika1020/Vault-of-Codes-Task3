	(function ($) {
		$.Shop = function (element) {
			this.$element = $(element);
			this.init();
		};

		$.Shop.prototype = {
			init: function () {

				// Properties

				this.cartPrefix = "Kpoppin-"; // Prefix string to be prepended to the cart's name in the session storage
				this.cartName = this.cartPrefix + "cart"; // Cart name in the session storage
				this.shippingRates = this.cartPrefix + "shipping-rates"; // Shipping rates key in the session storage
				this.total = this.cartPrefix + "total"; // Total key in the session storage
				this.storage = sessionStorage; // shortcut to the sessionStorage object


				this.$formAddToCart = this.$element.find("form.add-to-cart"); // Forms for adding items to the cart
				this.$formCart = this.$element.find("#shopping-cart"); // Shopping cart form
				this.$checkoutCart = this.$element.find("#checkout-cart"); // Checkout form cart
				this.$checkoutOrderForm = this.$element.find("#checkout-order-form"); // Checkout user details form
				this.$shipping = this.$element.find("#sshipping"); // Element that displays the shipping rates
				this.$subTotal = this.$element.find("#stotal"); // Element that displays the subtotal charges
				this.$shoppingCartActions = this.$element.find("#shopping-cart-actions"); // Cart actions links
				this.$updateCartBtn = this.$shoppingCartActions.find("#update-cart"); // Update cart button
				this.$emptyCartBtn = this.$shoppingCartActions.find("#empty-cart"); // Empty cart button
				this.$userDetails = this.$element.find("#user-details-content"); // Element that displays the user information



				this.currency = "&#8377; "; // HTML entity of the currency to be displayed in the layout
				this.currencyString = "₹"; // Currency symbol as string

				// Object containing patterns for form validation
				this.requiredFields = {
					expression: {
						value: /^([\w-\.]+)@((?:[\w]+\.)+)([a-z]){2,4}$/
					},

					str: {
						value: ""
					}

				};

				// Method invocation

				this.createCart();
				this.handleAddToCartForm();
				this.handleCheckoutOrderForm();
				this.emptyCart();
				this.updateCart();
				this.displayCart();
				this.deleteProduct();
				this.displayUserDetails();
			},

			// Public methods

			// Creates the cart keys in the session storage

			createCart: function () {
				if (this.storage.getItem(this.cartName) == null) {

					var cart = {};
					cart.items = [];

					this.storage.setItem(this.cartName, this._toJSONString(cart));
					this.storage.setItem(this.shippingRates, "0");
					this.storage.setItem(this.total, "0");
				}
			},


			// Displays the user's information

			displayUserDetails: function () {
				if (this.$userDetails.length) {

					var name = this.storage.getItem("billing-name");
					var email = this.storage.getItem("billing-email");
					var city = this.storage.getItem("billing-city");
					var address = this.storage.getItem("billing-address");
					var zip = this.storage.getItem("billing-zip");

					var html = "<div class='detail'>";
					html += "<h2>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Billing and Shipping</h2>";
					html += "<ul>";
					html += "Name:&emsp;" + name + "<br/><br/>";
					html += "Email:&emsp;" + email + "<br/><br/>";
					html += "City:&emsp;" + city + "<br/><br/>";
					html += "Address:&emsp;" + address + "<br/><br/>";
					html += "Zip Code:&emsp;" + zip + "<br/>";
					html += "</ul></div>";

					this.$userDetails[0].innerHTML = html;

					this.storage.clear();
				}
			},

			// Delete a product from the shopping cart

			deleteProduct: function () {
				var self = this;
				if (self.$formCart.length) {
					var cart = this._toJSONObject(this.storage.getItem(this.cartName)); //get the cart name as the object
					var items = cart.items; //get the arary of items

					$(document).on("click", ".pdelete a", function (e) {
						e.preventDefault(); //prevents from redirecting
						var productName = $(this).data("product"); //get the name of the product to be deleted
						var newItems = [];
						for (var i = 0; i < items.length; ++i) { //traverse the elements of the item array
							var item = items[i];
							var product = item.product; //name of the product
							if (product == productName) { //check if it is the one to be deleted
								items.splice(i, 1); //removes the ith element from the items array
							}
						}
						newItems = items;
						var updatedCart = {};
						updatedCart.items = newItems;

						var updatedTotal = 0;
						var totalQty = 0;
						if (newItems.length == 0) { //if item wasnt deleted
							updatedTotal = 0;
							totalQty = 0;
						} else {
							for (var j = 0; j < newItems.length; ++j) { //iterate through the updated list of items
								var prod = newItems[j];
								var sub = prod.price * prod.qty;
								updatedTotal += sub;
								totalQty += prod.qty; //calculate the new total
							}
						}
						//update the values in cache
						self.storage.setItem(self.total, self._convertNumber(updatedTotal));
						self.storage.setItem(self.shippingRates, self._convertNumber(self._calculateShipping(updatedTotal)));

						self.storage.setItem(self.cartName, self._toJSONString(updatedCart));
						$(this).parents("tr").remove();//remove the row from the table that is ebing diplayed, paremts() returns all the ancestors of "this", tr is the filet for ancestors
						self.$subTotal[0].innerHTML = self.currency + " " + self.storage.getItem(self.total);
					});
				}
			},

			// Displays the shopping cart

			displayCart: function () {
				if (this.$formCart.length) {
					var cart = this._toJSONObject(this.storage.getItem(this.cartName)); //get the cart name
					var items = cart.items; //find the array of items for the cart
					var $tableCart = this.$formCart.find(".shopping-cart"); 
					var $tableCartBody = $tableCart.find("tbody");

					if (items.length == 0) {
						$tableCartBody.html("");
					} else {


						for (var i = 0; i < items.length; ++i) { //cycle through the items in the cart
							var item = items[i];
							var product = item.product;
							var price = this.currency + " " + item.price; // store string with currency followed by price
							var qty = item.qty;
							//store the elements to be printed in string format within the html variable
							var html = "<tr><td class='pname'>" + product + "</td>" + "<td class='pqty'><input type='text' value='" + qty + "' class='qty'/></td>";
							html += "<td class='pprice'>" + price + "</td><td class='pdelete'><a href='' data-product='" + product + "'>&times;</a></td></tr>";//product signifies the one to be delted if cross mark is clicked

							$tableCartBody.html($tableCartBody.html() + html); //replaces the tbody code with html variable content
						}

					}

					if (items.length == 0) {
						this.$subTotal[0].innerHTML = this.currency + " " + 0.00;
					} else {

						var total = this.storage.getItem(this.total);
						this.$subTotal[0].innerHTML = this.currency + " " + total;
					}
				} else if (this.$checkoutCart.length) { //prints the checkout cart table
					var checkoutCart = this._toJSONObject(this.storage.getItem(this.cartName));
					var cartItems = checkoutCart.items;
					var $cartBody = this.$checkoutCart.find("tbody");

					if (cartItems.length > 0) {

						for (var j = 0; j < cartItems.length; ++j) {//goes through all the elements
							var cartItem = cartItems[j];
							var cartProduct = cartItem.product;
							var cartPrice = this.currency + " " + cartItem.price;
							var cartQty = cartItem.qty;
							var cartHTML = "<tr><td class='pname'>" + cartProduct + "</td>" + "<td class='pqty'>" + cartQty + "</td>" + "<td class='pprice'>" + cartPrice + "</td></tr>";

							$cartBody.html($cartBody.html() + cartHTML);
						}
					} else {
						$cartBody.html("");
					}

					if (cartItems.length > 0) {

						var cartTotal = this.storage.getItem(this.total);	//get the total
						var cartShipping = this.storage.getItem(this.shippingRates);
						var subTot = this._convertString(cartTotal) + this._convertString(cartShipping);

						this.$subTotal[0].innerHTML = this.currency + " " + this._convertNumber(subTot);
						this.$shipping[0].innerHTML = this.currency + " " + cartShipping;
					} else {
						this.$subTotal[0].innerHTML = this.currency + " " + 0.00;
						this.$shipping[0].innerHTML = this.currency + " " + 0.00;
					}

				}
			},

			// Empties the cart by calling the _emptyCart() method
		

			emptyCart: function () {
				var self = this;

				self.$emptyCartBtn.on("click", function () {
					self._emptyCart();
				});

			},

			// Updates the cart

			updateCart: function () {
				var self = this;
				if (self.$updateCartBtn.length) {
					self.$updateCartBtn.on("click", function () { //if the update button was clicked
						var $rows = self.$formCart.find("tbody tr");
						var cart = self.storage.getItem(self.cartName); //get the cart name
						var shippingRates = self.storage.getItem(self.shippingRates); 
						var total = self.storage.getItem(self.total); //get total value

						var updatedTotal = 0;
						var totalQty = 0;
						var updatedCart = {};
						updatedCart.items = [];

						$rows.each(function () {
							var $row = $(this);
							var pname = $.trim($row.find(".pname").text()); 
							var pqty = self._convertString($row.find(".pqty > .qty").val()); //get updated quantity values
							var pprice = self._convertString(self._extractPrice($row.find(".pprice"))); //updated price

							var cartObj = { //populate update values
								product: pname,
								price: pprice,
								qty: pqty
							};

							updatedCart.items.push(cartObj);

							var subTotal = pqty * pprice; //calculate new subtotal
							updatedTotal += subTotal;//final ampunt
							totalQty += pqty; //final quantity
						});

						self.storage.setItem(self.total, self._convertNumber(updatedTotal)); //update in cache
						self.storage.setItem(self.shippingRates, self._convertNumber(self._calculateShipping(updatedTotal)));
						self.storage.setItem(self.cartName, self._toJSONString(updatedCart));

					});
				}
			},

			// Adds items to the shopping cart

			handleAddToCartForm: function () {
				var self = this;
				self.$formAddToCart.each(function () {
					var $form = $(this);
					var $product = $form.parent();//finds the direct ancestor wrt to form
					var price = self._convertString($product.data("price")); //fetching value of price and converting it to string
					var name = $product.data("name"); //fetching name of product

					$form.on("submit", function () {
						var qty = self._convertString($form.find(".qty").val()); //find quantity of the product and convert to string
						var subTotal = qty * price; //calculate total price
						var total = self._convertString(self.storage.getItem(self.total)); //find the current total amount
						var sTotal = total + subTotal; //calculate new total
						self.storage.setItem(self.total, sTotal); //update the total
						self._addToCart({ //update the product details in the object
							product: name,
							price: price,
							qty: qty
						});
						var shipping = self._convertString(self.storage.getItem(self.shippingRates));
						var shippingRates = self._calculateShipping(total);
						var totalShipping = shipping + shippingRates;

						self.storage.setItem(self.shippingRates, totalShipping);
					});
				});
			},

			// Handles the checkout form by adding a validation routine and saving user's info into the session storage

			handleCheckoutOrderForm: function () {
				var self = this;
				if (self.$checkoutOrderForm.length) {
					var $sameAsBilling = $("#same-as-billing");
					$sameAsBilling.on("change", function () {
						var $check = $(this);
						if ($check.prop("checked")) {
							$("#fieldset-shipping").slideUp("normal");
						} else {
							$("#fieldset-shipping").slideDown("normal");
						}
					});

					self.$checkoutOrderForm.on("submit", function () {
						var $form = $(this);
						var valid = self._validateForm($form);

						if (!valid) {
							return valid;
						} else {
							self._saveFormData($form);
						}
					});
				}
			},

			// Private methods


			// Empties the session storage

			_emptyCart: function () {
				this.storage.clear();
			},

			/* format a number by decimal places
			  num is the number to be formatted
			  places is the number the decimal places
			  returns n which is number the formatted number
			 */



			_formatNumber: function (num, places) {
				var n = num.toFixed(places);
				return n;
			},

			/* extract the numeric portion from a string
			element object is the jquery element that contains the relevant string
			  returns price string the numeric string
			 */


			_extractPrice: function (element) {
				var self = this;
				var text = element.text();
				var price = text.replace(self.currencyString, "").replace(" ", "");
				return price;
			},

			/* converts a numeric string into a number
			 	numStr is String the numeric string to be converted
				returns num Number the number
			 */

			_convertString: function (numStr) {
				var num;
				if (/^[-+]?[0-9]+\.[0-9]+$/.test(numStr)) { //check if decimal
					num = parseFloat(numStr);
				} else if (/^\d+$/.test(numStr)) { //check if integer
					num = parseInt(numStr, 10);
				} else {//if doesnt satisfy above 2 conditions
					num = Number(numStr);
				}

				if (!isNaN(num)) {
					return num;
				} else {
					console.warn(numStr + " cannot be converted into a number");
					return false;
				}
			},

			/* converts a number to a string
			  n is the number the number to be converted
			  returns str String the string returned
			 */

			_convertNumber: function (n) {
				var str = n.toString();
				return str;
			},

			/* converts a JSON string to a JavaScript object
			  str String the JSON string
			 returns obj Object the JavaScript object
			 */

			_toJSONObject: function (str) {
				var obj = JSON.parse(str);
				return obj;
			},

			/* converts a JavaScript object to a JSON string
			  obj Object the JavaScript object
			  returns str String the JSON string
			 */


			_toJSONString: function (obj) {
				var str = JSON.stringify(obj);
				return str;
			},


			/* add an object to the cart as a JSON string
			  param values Object the object to be added to the cart
			 	returns void
			 */


			_addToCart: function (values) {	
				var cart = this.storage.getItem(this.cartName);

				var cartObject = this._toJSONObject(cart);
				var cartCopy = cartObject;
				var items = cartCopy.items;//copy items to be updated
				items.push(values);

				this.storage.setItem(this.cartName, this._toJSONString(cartCopy));
			},

			/* custom shipping rates calculation based on the total quantity of items in the cart
			   qty Number the total quantity of items
			  returns shipping Number the shipping rates
			 */

			_calculateShipping: function (total) {
				var shipping = 0;
				if (total < 1000)
					shipping = 0;
				return shipping;

			},

			/* validates the checkout form
			   form Object the jQuery element of the checkout form
			  returns valid Boolean true for success, false for failure
			 */



			_validateForm: function (form) {
				var self = this;
				var fields = self.requiredFields;
				var $visibleSet = form.find("fieldset:visible");
				var valid = true;

				form.find(".message").remove();

				$visibleSet.each(function () {

					$(this).find(":input").each(function () {
						var $input = $(this);
						var type = $input.data("type");
						var msg = $input.data("message");

						if (type == "string") {
							if ($input.val() == fields.str.value) {
								$("<span class='message'/>").text(msg).
								insertBefore($input);

								valid = false;
							}
						} else {
							if (!fields.expression.value.test($input.val())) {
								$("<span class='message'/>").text(msg).
								insertBefore($input);

								valid = false;
							}
						}

					});
				});

				return valid;

			},

			/* save the data entered by the user in the ckeckout form
			   form Object the jQuery element of the checkout form
			   returns void
			 */


			_saveFormData: function (form) {
				var self = this;
				var $visibleSet = form.find("fieldset:visible");

				$visibleSet.each(function () {
					var $set = $(this);
					if ($set.is("#fieldset-billing")) {
						//setting the corresponding user details
						var name = $("#name", $set).val(); 
						var email = $("#email", $set).val();
						var city = $("#city", $set).val();
						var address = $("#address", $set).val();
						var zip = $("#zip", $set).val();
						//storing it with a key
						self.storage.setItem("billing-name", name);
						self.storage.setItem("billing-email", email);
						self.storage.setItem("billing-city", city);
						self.storage.setItem("billing-address", address);
						self.storage.setItem("billing-zip", zip);
					}
				});
			}
		};

		$(function () {
			var shop = new $.Shop("#site");
		});

	})(jQuery);