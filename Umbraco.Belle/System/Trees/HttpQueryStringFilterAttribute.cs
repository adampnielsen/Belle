﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Formatting;
using System.Web;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace Umbraco.Belle.System.Trees
{
    /// <summary>
    /// Allows an Action to execute with an arbitrary number of QueryStrings
    /// </summary>
    /// <remarks>
    /// Just like you can POST an arbitrary number of parameters to an Action, you can't GET an arbitrary number
    /// but this will allow you to do it
    /// </remarks>
    public class HttpQueryStringFilterAttribute : ActionFilterAttribute
    {
        public string ParameterName { get; private set; }

        public HttpQueryStringFilterAttribute(string parameterName)
        {
            if (string.IsNullOrEmpty(parameterName))
                throw new ArgumentException("ParameterName is required.");
            ParameterName = parameterName;
        }

        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            //get the query strings from the request properties
            var queryStrings = actionContext.Request.Properties["MS_QueryNameValuePairs"] as IEnumerable<KeyValuePair<string, string>>;
            if (queryStrings == null) return;
            
            var formData = new FormDataCollection(queryStrings);

            actionContext.ActionArguments[ParameterName] = formData;
            
            base.OnActionExecuting(actionContext);
        }
    }
}