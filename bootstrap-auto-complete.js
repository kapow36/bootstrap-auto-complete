(function ($)
{
    $.fn.autoComplete = function (actionOrOptions)
    {
        if (actionOrOptions === "valid")
        {
            return isInputValid(this, this.data("suggestions"));
        }
        else
        {
            this.each(function ()
            {
                var _this = $(this);

                if (!_this.is("input") && !_this.is(".input-group"))
                {
                    throw "auto-complete must be an input";
                }

                //data attributes
                var url = _this.data("url");
                var loaderUrl = _this.data("loader-url");
                var maxCount = _this.data("max-count");

                //options
                if (actionOrOptions)
                {
                    url = actionOrOptions.url ? actionOrOptions.url : url;
                    url = actionOrOptions.loaderUrl ? actionOrOptions.loaderUrl : loaderUrl;
                    url = actionOrOptions.maxCount ? actionOrOptions.maxCount : maxCount;
                }

                //defaults
                maxCount = maxCount ? maxCount : 5;

                //set properties
                _this.data("url", url);
                _this.data("loader-url", loaderUrl);
                _this.data("max-count", maxCount);

                //edit html
                if (_this.parent().hasClass("input-group") === true)
                {
                    _this.parent().addClass("dropdown");
                }
                else
                {
                    _this.wrap("<div class='dropdown'></div>");
                }
                _this.after("<div class='dropdown-menu' style='padding:0;'><select class='form-control' tabindex='-1'></select></div>");
                _this.addClass("searching");
                _this.attr("autocomplete", "off");
                _this.wrap("<div style='position:relative;'></div>");
                if (loaderUrl)
                {
                    _this.after("<style type='text/css'>.searching.in { background-position: right 5px center; background-repeat:no-repeat; background-image:url(" + loaderUrl + ") } .has-feedback .searching.in { background-position: right 25px center; }</style>");
                }

                //events
                _this.keyup(function (event)
                {
                    var currentText = _this.val();
                    if (event.keyCode === 40)//down arrow
                    {
                        var currentOption = _this.parents(".dropdown").find("select > option:checked");
                        if (currentOption.next().length > 0)
                        {
                            currentOption.prop("selected", false);
                            currentOption.next().prop("selected", true);
                            _this.val(currentOption.next().text());
                            _this.trigger("change");
                        }
                    }
                    else if (event.keyCode === 38)//up arrow
                    {
                        var currentOption = _this.parents(".dropdown").find("select > option:checked");
                        if (currentOption.prev().length > 0)
                        {
                            currentOption.prop("selected", false);
                            currentOption.prev().prop("selected", true);
                            _this.val(currentOption.prev().text());
                            _this.trigger("change");
                        }
                    }
                    else if (currentText.length <= 3)
                    {
                        _this.data("suggestions", []);
                        updateSuggestions(_this);
                    }
                    else if (currentText.length > 3 && !_this.data("loading"))
                    {
                        showSearchLoader(_this);
                        $.ajax({
                            url: _this.data("url"),
                            async: true,
                            cache: false,
                            method: "POST",
                            data: { filter: currentText, count: _this.data("max-count") },
                            success: function (data)
                            {
                                _this.data("suggestions", data);
                                updateSuggestions(_this);
                                if (_this.val() !== currentText)
                                {
                                    hideSearchLoader(_this);//yes we are hiding it twice, but success gets called before complete
                                    _this.trigger("keyup");
                                }
                            },
                            complete: function ()
                            {
                                hideSearchLoader(_this);
                            },
                            useGlobalLoader: false
                        });
                    }
                });

                _this.focus(function ()
                {
                    if (!_this.data("prevent-blur"))
                    {
                        if (_this.parents(".dropdown").find("option").length > 0)
                        {
                            _this.parents(".dropdown").addClass("open");
                        }
                    }
                    _this.data("prevent-blur", false);
                });

                _this.blur(function ()
                {
                    //we need to let the events propigate so selection click gets called
                    if (_this.data("prevent-blur"))
                    {
                        _this.focus();//we'll set PreventBlur to false on the focus event since we don't want the dropdown refreshed
                    }
                    else
                    {
                        _this.data("has-blurred", true);
                        updateSuggestions(_this);
                        _this.parents(".dropdown").removeClass("open");
                    }
                });

                _this.parents(".dropdown").find("select").click(function ()
                {
                    _this.val(_this.parents(".dropdown").find("select").val());//set text                    
                    _this.blur();//blur search again (right after we just gained it)     
                    _this.trigger("change");
                });

                //this event is needed so the click event actually goes through
                _this.parents(".dropdown").find("select").mousedown(function ()
                {
                    _this.data("prevent-blur", true);
                });
            });
        }

        function showSearchLoader(element)
        {
            element.data("loading", true);
            element.addClass("in");
        }

        function hideSearchLoader(element)
        {
            element.data("loading", false);
            element.removeClass("in");
        }

        function updateSuggestions(element)
        {
            var suggestions = element.data("suggestions");
            element.parents(".dropdown").find("select").empty();

            if (!suggestions)
            {
                suggestions = [];
            }

            var isValid = isInputValid(element, suggestions);
            if (isValid === true)
            {
                suggestions = [];
            }

            if (suggestions.length > 0)
            {
                if (element.is(":focus"))
                {
                    element.parents(".dropdown").addClass("open");
                }

                element.parents(".dropdown").find("select").append("<option selected style='font-style:italic;'>" + element.val() + "</option>");
                var size = 1;
                for (var i = 0; i < element.data("max-count") && i < suggestions.length; i++)
                {
                    if (suggestions[i].toLowerCase() !== element.val().toLowerCase())
                    {
                        element.parents(".dropdown").find("select").append("<option>" + suggestions[i] + "</option>");
                        size++;
                    }
                }
                element.parents(".dropdown").find("select").attr("size", Math.max(size, 2));//must have a size of at least 2
            }
            else
            {
                element.parents(".dropdown").removeClass("open");
            }

            if (isValid === true)
            {
                //clear validation

                //form group
                if (element.closest(".form-group").is(".has-feedback"))
                {
                    element.closest(".form-group").find(".form-control-feedback").remove();
                    element.closest(".form-group").removeClass("has-feedback");
                    element.closest(".form-group").removeClass("has-warning");
                    element.removeAttr("title");
                }

                //input group
                if (element.closest(".input-group").is(".has-feedback"))
                {
                    element.closest(".input-group").find(".form-control-feedback").remove();
                    element.closest(".input-group").removeClass("has-feedback");
                    element.closest(".input-group").removeClass("has-warning");

                    element.removeAttr("title");
                }
            }
            else
            {
                /*
                    if...
                    1. input has blurred at least once
                    2. input belongs to a form-group
                    3. input belongs to a form-group that doesn't have any validation
                */
                if (element.data("has-blurred") === true
                    && element.parents(".form-group").length
                    && !element.closest(".form-group").is(".has-feedback"))
                {
                    element.closest(".form-group").addClass("has-feedback");
                    element.closest(".form-group").addClass("has-warning");
                    element.after("<span class='glyphicon glyphicon-warning-sign form-control-feedback'></span>");
                    element.attr("title", element.data("validation-message"));
                }

                /*
                    if...
                    1. input has blurred at least once
                    2. input belongs to a input-group
                    3. input belongs to a input-group that doesn't have any validation
                */
                if (element.data("has-blurred") === true
                    && element.parents(".input-group").length
                    && !element.closest(".input-group").is(".has-feedback"))
                {
                    element.closest(".input-group").addClass("has-feedback");
                    element.closest(".input-group").addClass("has-warning");
                    element.after("<span class='glyphicon glyphicon-warning-sign form-control-feedback'></span>");
                    element.attr("title", element.data("validation-message"));
                }
            }
        }

        function isInputValid(element, suggestions)
        {
            var isValid = false;

            if (suggestions.length <= 0 && element.val().length <= 0)
            {
                isValid = true;
            }

            //check to see if value matches a suggestion
            for (var i = 0; i < suggestions.length; i++)
            {
                if (suggestions[i].toLowerCase() === element.val().toLowerCase())
                {
                    isValid = true;
                }
            }

            return isValid;
        }
    };
}(jQuery));


$(document).ready(function ()
{
    $(".auto-complete").autoComplete();
});
