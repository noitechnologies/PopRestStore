var CheckOutPage = {
  name: "checkout-page",
  data() {
    return {
      productsInCart: [],
      shippingAddress: {},
      paymentMethod: {},
      shippingMethod: {},
      listShippingAddress: [],
      listPaymentMethods: [],
      shippingOption: "",
      addressOption: {},
      paymentOption: "",
      paymentId: {},
      stateShippingAddress:1,
      stateShippingMethod:0,
      statePaymentMethod:0,
      listShippingOptions: [],
      optionNavbar:1,
      axiosConfig: {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          "api_key":storeInfo.apiKey,
          "moquiSessionToken":storeInfo.moquiSessionToken
        }
      }
    };
  },
  methods: {
    getCustomerShippingAddresses() {
      CustomerService.getShippingAddresses(this.axiosConfig).then(function (data) {
        this.listShippingAddress = data.postalAddressList;
      }.bind(this));
    },
    addCustomerShippingAddress() {
      CustomerService.addShippingAddress(this.shippingAddress,this.axiosConfig).then(function (data) {
        this.shippingAddress = {};
        this.getCustomerShippingAddresses();
        this.hideModal("modal1");
      }.bind(this));
    },
    getCartShippingOptions() {
      ProductService.getCartShippingOptions(this.axiosConfig).then(function (data) {
        this.listShippingOptions = data.shippingOptions;
      }.bind(this));
    },
    getCartInfo() {
      ProductService.getCartInfo(this.axiosConfig).then(function (data) {
          if(data.postalAddress != undefined) {
            this.addressOption = data.postalAddress.contactMechId + ':' + data.postalAddress.telecomContactMechId;
            this.shippingAddress = data.postalAddress;
            this.shippingAddress.contactNumber = data.telecomNumber.contactNumber;
          }
          if(data.orderPart.carrierPartyId != undefined) {
            this.shippingOption = data.orderPart.carrierPartyId + ':' + data.orderPart.shipmentMethodEnumId;
            for(var x in this.listShippingOptions) {
              if(this.shippingOption === this.listShippingOptions[x].carrierPartyId +':'+ this.listShippingOptions[x].shipmentMethodEnumId) {
                this.shippingMethod = this.listShippingOptions[x];
                break;
              }
            }
          }
          if(data.paymentInfoList[0] != null) {
            this.paymentOption = data.paymentInfoList[0].payment.paymentMethodId;
            for(var x in this.listPaymentMethods) {
              if(this.paymentOption === this.listPaymentMethods[x].paymentMethodId) {
                this.paymentMethod = this.listPaymentMethods[x].paymentMethod;
                this.paymentMethod.expireMonth = this.listPaymentMethods[x].expireMonth; 
                this.paymentMethod.expireYear = this.listPaymentMethods[x].expireYear;
                break;
              }
            }
          }
          this.productsInCart = data;
      }.bind(this));
    },
    addCustomerPaymentMethod() {
      this.paymentMethod.paymentMethodTypeEnumId = "PmtCreditCard";
      CustomerService.addPaymentMethod(this.paymentMethod,this.axiosConfig).then(function (data) {
        console.log(data);
        this.hideModal("modal2");
        this.paymentMethod = {};
        this.getCustomerPaymentMethods();
      }.bind(this));
    },
    addCartBillingShipping(option){
      var info = {
        "shippingPostalContactMechId":this.addressOption.split(':')[0],
        "shippingTelecomContactMechId":this.addressOption.split(':')[1],
        "paymentMethodId":this.paymentOption,
        "carrierPartyId":this.shippingOption.split(':')[0],
        "shipmentMethodEnumId":this.shippingOption.split(':')[1]
      };
      switch(option){
        case 1: 
          this.stateShippingAddress = 2;
          this.stateShippingMethod = 1;
          $('#collapse2').collapse("show");
          break;
        case 2:
          this.stateShippingMethod = 2;
          this.statePaymentMethod = 1;
          $('#collapse3').collapse("show");  
          break;
        case 3:
          this.statePaymentMethod = 2;  
          $('#collapse4').collapse("show");
          break;
       }
      ProductService.addCartBillingShipping(info,this.axiosConfig).then(function (data) {
        this.paymentId = data;   
        this.getCartInfo();
      }.bind(this));
    },
    setOptionNavbar(option) {
      this.optionNavbar = option; 
    },
    getCustomerPaymentMethods() {
      CustomerService.getPaymentMethods(this.axiosConfig).then(function (data) {
        this.listPaymentMethods = data.methodInfoList;
      }.bind(this));
    },
    setCartPlace() {
      const that = this;
      var data = {
        "cardSecurityCodeByPaymentId": this.paymentId
      };
      ProductService.setCartPlace(data,this.axiosConfig).then(function (data) {
        this.getCartInfo();
        this.$router.push({ name: 'successcheckout', params: { orderId: data.orderHeader.orderId }});
      }.bind(this));
    },
    deletePaymentMethod(paymentMethodId) {
      CustomerService.deletePaymentMethod(paymentMethodId,this.axiosConfig).then(function (data) {
        this.getCustomerPaymentMethods();
      }.bind(this));
    },
    deleteShippingAddress(contactMechId,contactMechPurposeId) {
      CustomerService.deleteShippingAddress(contactMechId,contactMechPurposeId, this.axiosConfig).then(function (data) {
        this.getCustomerShippingAddresses();
      }.bind(this));
    },
    updateProductQuantity(item) {
      var data = {
        "orderId": item.orderId,
        "orderItemSeqId": item.orderItemSeqId,
        "quantity": item.quantity
      }
      ProductService.updateProductQuantity(data,this.axiosConfig).then(function (data) {
        this.getCartInfo();
      }.bind(this));
    },
    deleteOrderProduct(item) {
      ProductService.deleteOrderProduct(item.orderId,item.orderItemSeqId,this.axiosConfig).then(function (data) {
        this.getCartInfo();
      }.bind(this));
    },
    selectAddress(address) {
      this.shippingAddress = {};
      this.shippingAddress.address1 = address.postalAddress.address1;
      this.shippingAddress.address2 = address.postalAddress.address2;
      this.shippingAddress.toName = address.postalAddress.toName;
      this.shippingAddress.city = address.postalAddress.city;
      this.shippingAddress.countryGeoId = address.postalAddress.countryGeoId;
      this.shippingAddress.contactNumber = address.telecomNumber.contactNumber;
      this.shippingAddress.postalCode = address.postalAddress.postalCode;
      this.shippingAddress.stateProvinceGeoId = address.postalAddress.stateProvinceGeoId;
      this.shippingAddress.postalContactMechId = address.postalContactMechId;
      this.shippingAddress.telecomContactMechId = address.telecomContactMechId;
    },
    selectPaymentMethod(method) {
      this.paymentMethod = {};
      this.paymentMethod.paymentMethodId = method.paymentMethodId;
      this.paymentMethod.paymentMethodTypeEnumId = method.paymentMethod.PmtCreditCard;
      this.paymentMethod.cardNumber = method.creditCard.cardNumber;
      this.paymentMethod.titleOnAccount = method.paymentMethod.titleOnAccount;
      this.paymentMethod.expireMonth = method.expireMonth;
      this.paymentMethod.expireYear = method.expireYear;
      this.paymentMethod.validateSecurityCode = "";
    },
    hideModal(modalid) {
      $('#'+modalid).modal('hide');
    },
    changeShippingAddress(data) {
      this.shippingAddress = data.postalAddress;
      this.shippingAddress.contactNumber = data.telecomNumber.contactNumber; 
    }, 
    changePaymentMethod(data) {
      this.paymentMethod = data.paymentMethod;
      this.paymentMethod.expireMonth = data.expireMonth; 
      this.paymentMethod.expireYear = data.expireYear;
    },
    cleanShippingAddress() {
      this.shippingAddress = {};
    },
    cleanPaymentMethod() {
      this.paymentMethod = {};
    }
  },
  components: {
    "placeorder-navbar": PlaceOrderNavbarTemplate,
    "footer-page": FooterPageTemplate
  },
  mounted() {
    this.getCartShippingOptions();
    this.getCartInfo();
    this.getCustomerShippingAddresses();
    this.getCustomerPaymentMethods();
  }
};
var CheckOutPageTemplate = getPlaceholderRoute(
  "/store/components/pages/CheckOutPage/CheckOutPage.html",
  "CheckOutPage"
);