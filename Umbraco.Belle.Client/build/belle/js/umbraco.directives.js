/*! umbraco - v0.0.1-SNAPSHOT - 2013-05-24
 * http://umbraco.github.io/Belle
 * Copyright (c) 2013 Per Ploug, Anders Stenteberg & Shannon Deminick;
 * Licensed MIT
 */
'use strict';
define([ 'app','angular'], function (app,angular) {
angular.module('umbraco.directives', [])
.directive('val-regex', function () {

        /// <summary>
        ///     A custom directive to allow for matching a value against a regex string.
        ///     NOTE: there's already an ng-pattern but this requires that a regex expression is set, not a regex string
        ///</summary>

        return {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {

                var regex = new RegExp(scope.$eval(attrs.valRegex));

                ctrl.$parsers.unshift(function (viewValue) {
                    if (regex.test(viewValue)) {
                        // it is valid
                        ctrl.$setValidity('val-regex', true);
                        return viewValue;
                    }
                    else {
                        // it is invalid, return undefined (no model update)
                        ctrl.$setValidity('val-regex', false);
                        return undefined;
                    }
                });
            }
        };
    })

.directive('appVersion', ['version', function (version) {
    return function (scope, elm, attrs) {
        elm.text(version);
    };
}])

.directive('preventDefault', function () {
    return function (scope, element, attrs) {
        $(element).click(function (event) {
            event.preventDefault();
        });
    };
})

.directive('autoScale', function ($window) {
    return function (scope, el, attrs) {

        var totalOffset = 0;
        var offsety = parseInt(attrs.autoScale, 10);
        var window = angular.element($window);
        if (offsety !== undefined){
            totalOffset += offsety;
        }

        setTimeout(function () {
            el.height(window.height() - (el.offset().top + totalOffset));
        }, 300);

        window.bind("resize", function () {
            el.height(window.height() - (el.offset().top + totalOffset));
        });

    };
})


.directive('headline', function ($window) {
    return function (scope, el, attrs) {

        var h1 = $("<h1 class='umb-headline-editor'></h1>").hide();
        el.parent().prepend(h1);
        el.addClass("umb-headline-editor");

        if (el.val() !== '') {
            el.hide();
            h1.text(el.val());
            h1.show();
        } else {
            el.focus();
        }

        el.on("blur", function () {
            el.hide();
            h1.html(el.val()).show();
        });

        h1.on("click", function () {
            h1.hide();
            el.show().focus();
        });
    };
})


.directive('onKeyup', function () {
    return function (scope, elm, attrs) {
        elm.bind("keyup", function () {

            scope.$apply(attrs.onKeyup);
        });
    };
})

.directive('propertyEditor', function () {
    return {
        restrict: 'A',
        template: '<div class="controls controls-row" ng-include="editorView"></div>',
            //templateUrl: '/partials/template.html',
            link: function (scope, iterStartElement, attr) {

                var property = scope.$eval(attr.propertyEditor);
                var path = property.controller;
                var editor = "views/propertyeditors/" + property.view.replace('.', '/') + "/editor.html";

                if (path !== undefined && path !== "") {
                    path = "views/propertyeditors/" + path.replace('.', '/') + "/controller.js";
                    require([path], function () {
                        scope.editorView = editor;
                    });
                } else {
                    scope.editorView = editor;
                }


            }
        };
    })


.directive('onKeyDown', function ($key) {
    return {
        link: function (scope, elm, attrs) {
            $key('keydown', scope, elm, attrs);
        }
    };
})


.directive('onBlur', function () {
    return function (scope, elm, attrs) {
        elm.bind("blur", function () {
            scope.$apply(attrs.onBlur);
        });
    };
})

.directive('onFocus', function () {
    return function (scope, elm, attrs) {
        elm.bind("focus", function () {
            scope.$apply(attrs.onFocus);
        });
    };
});


angular.module('umbraco.directives')
.directive('umbInclude', function($compile, $http, $templateCache, $interpolate) {
  
  // Load a template, possibly from the $templateCache, and instantiate a DOM element from it
  function loadTemplate(template) {
    return $http.get(template, {cache:$templateCache}).then(function(response) {
      return angular.element(response.data);
    }, function(response) {
      throw new Error('Template not found: ' + template);
    });
  }

  // Find the "input" element in the template.  It will be one of input, select or textarea.
  // We need to ensure it is wrapped in jqLite\jQuery
  function findInputElement(templateElement) {
    return angular.element(templateElement.find('input')[0] || templateElement.find('select')[0] || templateElement.find('textarea')[0]);
  }

  function findLabelElement(templateElement) {
    return templateElement.find('label');
  }

  // Search through the originalDirective's element for elements that contain information about how to map
  // validation keys to messages
  function getValidationMessageMap(originalElement) {
    // Find all the <validator> child elements and extract their (key, message) info
    var validationMessages = {};
    angular.forEach(originalElement.find('validator'), function(element) {
      // Wrap the element in jqLite/jQuery
      element = angular.element(element);
      // Store the message info to be provided to the scope later
      // The content of the validation element may include interpolation {{}}
      // so we will actually store a function created by the $interpolate service
      // To get the interpolated message we will call this function with the scope. e.g.
      //   var messageString = getMessage(scope);
      validationMessages[element.attr('key')] = $interpolate(element.text());
    });
    return validationMessages;
  }

  // Find the content that will go into the new label
  // Label is provided as a <label> child element of the original element
  function getLabelContent(element) {
    var label = element.find('label');
    return label[0] && label.html();
  }

  return {
    restrict:'E',
    priority: 100,        // We need this directive to happen before ng-model
    terminal: false,       // We are going to deal with this element
    compile: function(element, attrs) {
      if ( attrs.ngRepeat || attrs.ngSwitch || attrs.uiIf ) {
        throw new Error('The ng-repeat, ng-switch and ui-if directives are not supported on the same element as the field directive.');
      }
      if ( !attrs.ngModel ) {
        throw new Error('The ng-model directive must appear on the field element');
      }

      // Extract the label and validation message info from the directive's original element
      //var validationMessages = getValidationMessageMap(element);
      //var labelContent = getLabelContent(element);

      // Clear the directive's original element now that we have extracted what we need from it
      element.html('');

      return function postLink(scope, element, attrs) {
        // Load up the template for this kind of field, default to the simple input if none given
        loadTemplate(attrs.template || 'error.html').then(function(templateElement) {
          // Set up the scope - the template will have its own scope, which is a child of the directive's scope
          var childScope = scope.$new();
          // Attach a copy of the message map to the scope
          //childScope.$validationMessages = angular.copy(validationMessages);
          // Generate an id for the field from the ng-model expression and the current scope
          // We replace dots with underscores to work with browsers and ngModel lookup on the FormController
          // We couldn't do this in the compile function as we need to be able to calculate the unique id from the scope
          //childScope.$fieldId = attrs.ngModel.replace('.', '_').toLowerCase() + '_' + childScope.$id;
          //childScope.$fieldLabel = labelContent;

          // Update the $fieldErrors array when the validity of the field changes
          /*childScope.$watch('$field.$dirty && $field.$error', function(errorList) {
            childScope.$fieldErrors = [];
            angular.forEach(errorList, function(invalid, key) {
              if ( invalid ) {
                childScope.$fieldErrors.push(key);
              }
            });
          }, true);
          */

          // Copy over all left over attributes to the input element
          /* We can't use interpolation in the template for directives such as ng-model
          var inputElement = findInputElement(templateElement);
          angular.forEach(attrs.$attr, function (original, normalized) {
            var value = element.attr(original);
            inputElement.attr(original, value);
          });*/

          // Wire up the input (id and name) and its label (for).
          // We need to set the input element's name here before we compile the template.
          /* If we leave it to be interpolated at the next $digest the formController doesn't pick it up
          inputElement.attr('name', childScope.$fieldId);
          inputElement.attr('id', childScope.$fieldId);
          var labelElement = templateElement.find('label');
          labelElement.attr('for', childScope.$fieldId);
          // Update the label's contents
          labelElement.html(labelContent);
          */

          // Place our template as a child of the original element.
          // This needs to be done before compilation to ensure that it picks up any containing form.
          element.append(templateElement);

          // We now compile and link our template here in the postLink function
          // This allows the ng-model directive on our template's <input> element to access the ngFormController
          $compile(templateElement)(childScope);

          // Now that our template has been compiled and linked we can access the <input> element's ngModelController
          //childScope.$field = inputElement.controller('ngModel');
        });
      };
    }
  };
});

return app;
});