/* this class present the sonardraw namespace an includes some general purpose
 * functions used in many functions */
window.SonarDraw = {
    enableDebug:true,
    /* debug function for firebug debugging console */
    debug:function() {
        if(typeof window.console != "undefined" && this.enableDebug === true) {
            console.log(arguments);
        }
    },

    /* Mixin function. 
     * this function provides easy mixin functionality which is able to pass
     * multiple inheritence, so if class a is mixed into class b, and class b
     * mixed into class c, class c provides both functionality from a and b*/
    mixin:function(receivingClass, givingClass) {
        //create prototype if nonexistant
        if(typeof receivingClass.prototype == "undefined")
            receivingClass.prototype = {};

        if(arguments[2]) { // Only give certain methods.
            for(var i = 2, len = arguments.length; i < len; i++) {
                if(givingClass.prototype[arguments[i]])
                    receivingClass.prototype[arguments[i]] = givingClass.prototype[arguments[i]];
                else if(givingClass[arguments[i]])
                    receivingClass.prototype[arguments[i]] = givingClass[arguments[i]];
            }
        } else { // Give all methods.
            for(methodName in givingClass.prototype) {
                if(!receivingClass.prototype[methodName]) {
                    receivingClass.prototype[methodName] = givingClass.prototype[methodName];
                }
            }
            for(methodName in givingClass) {
                if(!receivingClass.prototype[methodName]) {
                    receivingClass.prototype[methodName] = givingClass[methodName];
                }
            }
        }
    },

    /* wrapper to encapsulate functions into closures to use them for events.
     * it is called like that: SonarDraw.closuregen(this,"onresize") */
    closuregen:function(ctx,func) {
        return function() {ctx[func](arguments)};
    },

    /* Check wether object is undefined */
    isUndefined:function(obj) {
        if(typeof obj == "undefined") 
            return true
        else
            return false
    }
}

/* Public subscriber class */
SonarDraw.PublicSubscriber = function() {
    this.subscribers = {};
    this.register = function(object, signal, callback) {
        if(typeof this.subscribers[signal] == "undefined") {
            this.subscribers[signal] = {};
        }
        this.subscribers[signal][object] = callback;
        SonarDraw.debug("registered callback for signal",signal);
    }

    this.unregister = function(object,signal) {
        if(typeof this.subscribers[signal] != "undefined") {
            this.subscribers[signal][object] = undefined;
            SonarDraw.debug("callback unregistered<br/>");
        }
    }

    this.emit = function(signal,data) {
        var counter = 0;
        SonarDraw.debug("fire event:",signal,data);
        if(typeof this.subscribers[signal] != "undefined")
            for(var obj in this.subscribers[signal]) {
                if(typeof obj != "undefined" &&
                        typeof this.subscribers[signal][obj] == "function") {
                    this.subscribers[signal][obj](data);
                    counter++;
                }
            }
        SonarDraw.debug("fired to "+counter+" subscribers");
    }
}

/* Context Class 
 * The only element that has to be specified is the domElement,the rest is
 * optional*/
SonarDraw.DrawContext = function(settings) {
    if(typeof settings.domElement == "undefined") {
        throw new Error("DrawContext create without domElement");
    }

    this.domElement = settings.domElement;
    this.height = this.domElement.clientHeight;
    this.width = this.domElement.clientWidth;

    if(typeof settings.resolutionX == "undefined") 
        this.resolutionX = this.width;
    else
        this.resolutionY = settings.resolutionX;

    if(typeof settings.resolutionY == "undefined") 
        this.resolutionY = this.width;
    else
        this.resolutionY = settings.resolutionY;

    this.getHeight = function () {return this.height;}
    this.getWidth = function () {return this.width;}
    this.getDomElement = function () {return this.domElement;}
    this.getResolutionX = function () {return this.resolutionX;}
    this.getResolutionY = function () {return this.resolutionY;}

    this.onResize = function(ev) {
        var update = false;
        if(this.height != this.domElement.clientHeight) {
            this.height = this.domElement.clientHeight;
            update = true;
        }
        if(this.width != this.domElement.clientWidth) {
            this.width = this.domElement.clientWidth;
            update = true;
        }
        if(update == true)
            this.emit("onresize",{height:this.height,width:this.width});
    }

    // attach event handler to dom element
    window.addEventListener("resize",SonarDraw.closuregen(this,"onResize"),false);
}

// add public subscriber capabilities to drawcontext prototype
SonarDraw.mixin(SonarDraw.DrawContext,new SonarDraw.PublicSubscriber);

/* SonarDraw Class */
SonarDraw.SonarDraw = function() { }

SonarDraw.Position = function(x,y) {
    var me = {}
    if(SonarDraw.isUndefined(x)) 
        throw new Error("x is undefined");
    if(SonarDraw.isUndefined(y))
        throw new Error("y is undefined");

    me.x = x;
    me.y = y;

    this.getX = function() {
        return me.x;
    }

    this.getY = function() {
        return me.y;
    }

    this.setX = function(x) {
        me.x = x;
    }

    this.setY = function(y) {
        me.y = y;
    }

    this.set = function(x,y) {
        if(SonarDraw.isUndefined(x)) 
            throw new Error("x is undefined");
        if(SonarDraw.isUndefined(y))
            throw new Error("y is undefined");

        me.x = x;
        me.y = y;
    }

    this.get = function() {
        return {x:me.x,y:me.y};
    }
}
SonarDraw.mixin(SonarDraw.Position,new SonarDraw.PublicSubscriber);

SonarDraw.DrawEngine = function(ctx,settings) {
    var me = {};
    me["this"] = this;

    var defaultBackground = "#ffffff";
    me.backgroundColor = defaultBackground;

    if(!SonarDraw.isUndefined(settings))
        if(!SonarDraw.isUndefined(settings.background))
            me.backgroundColor = settings.background;


    me.context = ctx;

    me.stylegen = function() {
        return "width:"+me.context.getWidth()+"px;" +
            "height:"+me.context.getHeight()+"px;"
    }

    me.onResize = function(data) {
        me.canvas.setAttribute("style",me.stylegen());
        me.canvas.setAttribute("height",me.context.getHeight());
        me.canvas.setAttribute("width",me.context.getWidth());
        me.buffer.setAttribute("height",me.context.getHeight());
        me.buffer.setAttribute("width",me.context.getWidth());
    }

    //create a canvas environment and insert it into the drawcontext
    me.canvas = document.createElement("canvas");
    me.canvas.setAttribute("width",me.context.getWidth());
    me.canvas.setAttribute("height",me.context.getHeight());
    me.canvas.setAttribute("style",me.stylegen());
    //wipe content, then append canvas
    me.context.getDomElement().innerHTML = "";
    me.context.getDomElement().appendChild(me.canvas);

    //create a double buffer environment and insert it into the drawcontext
    me.buffer = document.createElement("canvas");
    me.buffer.setAttribute("width",me.context.getWidth());
    me.buffer.setAttribute("height",me.context.getHeight());

    //register to onresize events
    me.context.register(this,"onresize",SonarDraw.closuregen(me,"onResize"));

    // circle object
    me.Circle = function(engine,settings) {
        var me = {};

        var defaultColor = "#ababab";
        var defaultStrokeColor = "#ff0000";

        if(SonarDraw.isUndefined(engine))
            throw new Error("CanvasCircle: engine is undefined");
        if(SonarDraw.isUndefined(settings))
            throw new Error("CanvasCircle: settings is undefined");
        if(SonarDraw.isUndefined(settings.radius))
            throw new Error("CanvasCircle: radius is undefined");
        if(SonarDraw.isUndefined(settings.position))
            throw new Error("CanvasCircle: position is undefined");

        me.engine = engine;
        me.radius = settings.radius;
        me.position = settings.position;

        if(SonarDraw.isUndefined(settings.color))
            me.color = defaultColor;
        else
            me.color = settings.color;

        if(SonarDraw.isUndefined(settings.strokeColor))
            me.strokeColor = defaultStrokeColor;
        else
            me.strokeColor = settings.strokeColor;

        this.setPosition = function(pos) {
            me.position = pos;
            this.emit("onmove",me.position.get());
        }

        this.getPosition = function(pos) {
            return me.position;
        }

        this.setColor = function(col) {
            me.color = col;
            this.emit("oncolorchange",me.color);
        }

        this.getColor = function() {
            return me.color;
        }

        this.setStrokeColor = function(col) {
            me.strokeColor = col;
            this.emit("onstrokecolorchange",me.strokeColor);
        }

        this.getStrokeColor = function() {
            return me.strokeColor;
        }

        this.refresh = function() {
            var ctx = me.engine.buffer.getContext("2d");
            ctx.save();
            ctx.fillStyle = me.color;
            ctx.strokeStyle = me.strokeColor;
            ctx.beginPath();
            ctx.arc(me.position.getX(),me.position.getY(),me.radius,0,Math.PI*2,true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }
    SonarDraw.mixin(me.Circle,new SonarDraw.PublicSubscriber);

    me.Line = function(engine,settings) {
        var me = {};
        var defaultcolor = "#000000";

        if(SonarDraw.isUndefined(engine))
            throw new Error("CanvasLine: engine is undefined");
        if(SonarDraw.isUndefined(settings.o1))
            throw new Error("CanvasLine: First object is undefined");
        if(SonarDraw.isUndefined(settings.o1.getPosition()))
            throw new Error("CanvasLine: First object position is undefined");
        if(SonarDraw.isUndefined(settings.o2))
            throw new Error("CanvasLine: Second object is undefined");
        if(SonarDraw.isUndefined(settings.o2.getPosition()))
            throw new Error("CanvasLine: First object position is undefined");
        if(SonarDraw.isUndefined(settings))
            throw new Error("CanvasLine: Settings is undefined");

        me.engine = engine;
        me.o1 = settings.o1;
        me.o2 = settings.o2;

        if(SonarDraw.isUndefined(settings.color))
            me.color = defaultcolor;
        else
            me.color = settings.color;

        this.refresh = function() {
            var ctx = me.engine.buffer.getContext("2d");
            ctx.save();
            ctx.strokeStyle = me.color;
            ctx.beginPath();
            ctx.moveTo(me.o1.getPosition().getX(),me.o1.getPosition().getY());
            ctx.lineTo(me.o2.getPosition().getX(),me.o2.getPosition().getY());
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    this.createObject = function(objident, settings) {
        switch (objident) {
            case "circle":
                return new me.Circle(me,settings);
            case "line":
                return new me.Line(me,settings);
            default:
                new Error("Object type "+objident+" unknown");
        }
    }

    this.clear = function() {
        var ctx = me.buffer.getContext("2d");
        ctx.save();
        ctx.fillStyle = me.backgroundColor;
        ctx.clearRect(0,0,me.context.getWidth(),me.context.getHeight());
        ctx.fill();
        ctx.restore();
    }

    this.bufferFlip = function() {
        var ctx = me.canvas.getContext("2d");
        ctx.save();
        ctx.clearRect(0,0,me.context.getWidth(),me.context.getHeight());
        ctx.drawImage(me.buffer,0,0);
        ctx.restore();
    }
}
