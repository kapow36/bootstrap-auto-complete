(function ($)
{
    $.fn.autoComplete = function (options)
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
            if (options)
            {
                url = options.url ? options.url : url;
                url = options.loaderUrl ? options.loaderUrl : loaderUrl;
                url = options.maxCount ? options.maxCount : maxCount;
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
            _this.after("<div class='dropdown-menu' style='padding:0;'><select class='form-control'></select></div>");
            _this.addClass("searching");
            if (loaderUrl)
            {
                _this.after("<style type='text/css'>.searching.in { background-position: right 5px center; background-repeat:no-repeat; background-image:url(" + loaderUrl + ") }</style>");
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
                    }
                }
                else if (currentText.length <= 3)
                {
                    updateSuggestions(_this, []);
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
                            updateSuggestions(_this, data);
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
                    _this.parents(".dropdown").removeClass("open");
                }
            });

            _this.parents(".dropdown").find("select").click(function ()
            {
                _this.parents(".dropdown").removeClass("open");//close dropdown
                _this.val(_this.parents(".dropdown").find("select").val());//set text
                _this.focus();//focus search again
                _this.parents(".dropdown").removeClass("open");//we don't want the dropdown visible though
            });

            _this.parents(".dropdown").find("select").mousedown(function ()
            {
                _this.data("prevent-blur", true);
            });
        });

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

        function updateSuggestions(element, suggestions)
        {
            element.parents(".dropdown").find("select").empty();

            if (suggestions.length > 0)
            {
                element.parents(".dropdown").addClass("open");
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
                element.parents(".dropdown").find("select").attr("size", size);
            }
            else
            {
                element.parents(".dropdown").removeClass("open");
            }
        }
    };
}(jQuery));


$(document).ready(function ()
{
    $(".auto-complete").autoComplete();
});