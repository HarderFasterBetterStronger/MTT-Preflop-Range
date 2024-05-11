/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */'use strict';var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if('value'in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError('Cannot call a class as a function')}}window.ranger=window.ranger||{};/**
 * Set of utilities to handle Material Design Lite elements.
 */ranger.MaterialUtils=function(){function _class(){_classCallCheck(this,_class)}_createClass(_class,null,[{key:'refreshSwitchState',/**
   * Refreshes the UI state of the given Material Design Checkbox / Switch element.
   */value:function refreshSwitchState(element){if(element instanceof jQuery){element=element[0]}if(element.MaterialSwitch){element.MaterialSwitch.checkDisabled();element.MaterialSwitch.checkToggleState()}}/**
   * Closes the drawer if it is open.
   */},{key:'closeDrawer',value:function closeDrawer(){var drawerObfuscator=$('.mdl-layout__obfuscator');if(drawerObfuscator.hasClass('is-visible')){drawerObfuscator.click()}}/**
   * Clears the given Material Text Field.
   */},{key:'clearTextField',value:function clearTextField(element){element.value='';element.parentElement.MaterialTextfield.boundUpdateClassesHandler()}/**
   * Upgrades the text fields in the element.
   */},{key:'upgradeTextFields',value:function upgradeTextFields(element){componentHandler.upgradeElements($('.mdl-textfield',element).get())}/**
   * Returns a Promise which resolves when the user has reached the bottom of the page while
   * scrolling.
   * If an `offset` is specified the promise will resolve before reaching the bottom of
   * the page by the given amount offset in pixels.
   */},{key:'onEndScroll',value:function onEndScroll(){var offset=arguments.length>0&&arguments[0]!==undefined?arguments[0]:0;var resolver=new $.Deferred;var mdlLayoutElement=$('.mdl-layout');mdlLayoutElement.scroll(function(){if(window.innerHeight+mdlLayoutElement.scrollTop()+offset>=mdlLayoutElement.prop('scrollHeight')){console.log('Scroll End Reached!');mdlLayoutElement.unbind('scroll');resolver.resolve()}});console.log('Now watching for Scroll End.');return resolver.promise()}/**
   * Stops scroll listeners.
   */},{key:'stopOnEndScrolls',value:function stopOnEndScrolls(){var mdlLayoutElement=$('.mdl-layout');mdlLayoutElement.unbind('scroll')}},{key:'updateBadges',value:function updateBadges(){var uid=firebase.auth().currentUser.uid;firebase.database().ref('review/'+uid).once('value',function(snapshot){$('.reviewBadge').attr('data-badge',snapshot.numChildren())})}},{key:'checkRole',value:function checkRole(){var level=arguments.length>0&&arguments[0]!==undefined?arguments[0]:10;var uid=firebase.auth().currentUser.uid;return firebase.database().ref('users/'+uid).once('value').then(function(data){console.log(data.val().role);if(data.val().role===10){console.log('Pro Version');return true}else if(data.val().role===15){console.log('Coach');$('.coach').show();firebase.auth().currentUser.coach=true;return true}else{return fetch('https://us-central1-crushwithus-70cb5.cloudfunctions.net/userInfo',{headers:{'Content-Type':'application/json'},method:'POST',body:JSON.stringify({uid:uid})}).then(function(res){return res.json().then(function(json){var data=json.data;if(!data||data.isPro===undefined){return false}else if(data.isPro){return true}else{return false}})})}})}},{key:'upgrade',value:function upgrade(){var home=arguments.length>0&&arguments[0]!==undefined?arguments[0]:false;swal({title:'Premium Feature',text:'You need to upgrade to paid version to use this feature',type:'warning',showCancelButton:true,confirmButtonColor:'#DD6B55',confirmButtonText:'Upgrade',closeOnConfirm:true,showLoaderOnConfirm:true,allowEscapeKey:true},function(){page('https://ranger.raiseyouredge.com')});if(home===true){page('/')}}},{key:'countWeightedCombos',value:function countWeightedCombos(){var weightedSuits=$('.s').children();var weightedOff=$('.o').children();var weightedPP=$('.p').children();var categories={};categories.total=0;categories.category1=0;categories.category2=0;categories.category3=0;categories.category4=0;categories.category5=0;categories.category6=0;categories.category7=0;categories.category8=0;categories.category9=0;categories.category10=0;categories.category11=0;categories.category12=0;categories.category13=0;categories.category14=0;categories.category15=0;categories.category16=0;weightedSuits.each(function(index,element){categories.total+=4*($(element).attr('data-weight')/100);if($(element).hasClass('mdl-color--green')){categories.category1+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--amber')){categories.category2+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--red')){categories.category3+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--blue')){categories.category4+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--lime')){categories.category5+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--cyan')){categories.category6+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--brown')){categories.category7+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--grey')){categories.category8+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--teal')){categories.category9+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--indigo')){categories.category10+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--purple')){categories.category11+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--pink')){categories.category12+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--light-green')){categories.category13+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--orange')){categories.category14+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--deep-orange')){categories.category15+=4*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--deep-purple')){categories.category16+=4*($(element).attr('data-weight')/100)}});weightedOff.each(function(index,element){categories.total+=12*($(element).attr('data-weight')/100);if($(element).hasClass('mdl-color--green')){categories.category1+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--amber')){categories.category2+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--red')){categories.category3+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--blue')){categories.category4+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--lime')){categories.category5+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--cyan')){categories.category6+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--brown')){categories.category7+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--grey')){categories.category8+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--teal')){categories.category9+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--indigo')){categories.category10+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--purple')){categories.category11+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--pink')){categories.category12+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--light-green')){categories.category13+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--orange')){categories.category14+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--deep-orange')){categories.category15+=12*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--deep-purple')){categories.category16+=12*($(element).attr('data-weight')/100)}});weightedPP.each(function(index,element){categories.total+=6*($(element).attr('data-weight')/100);if($(element).hasClass('mdl-color--green')){categories.category1+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--amber')){categories.category2+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--red')){categories.category3+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--blue')){categories.category4+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--lime')){categories.category5+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--cyan')){categories.category6+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--brown')){categories.category7+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--grey')){categories.category8+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--teal')){categories.category9+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--indigo')){categories.category10+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--purple')){categories.category11+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--pink')){categories.category12+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--light-green')){categories.category13+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--orange')){categories.category14+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--deep-orange')){categories.category15+=6*($(element).attr('data-weight')/100)}if($(element).hasClass('mdl-color--deep-purple')){categories.category16+=6*($(element).attr('data-weight')/100)}});return categories}}]);return _class}();
//# sourceMappingURL=utils.js.map