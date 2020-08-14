class GraphUtil{
    constructor(){}
    static disposeObject(obj) {
        if (obj.material.map) 
        {
            obj.material.map.dispose();
        }
        if (obj.material) 
        {
            obj.material.dispose();
        }
        if (obj.geometry) 
        {
            obj.geometry.dispose();
        }
        if (obj.dispose) 
        {
            obj.dispose();
        }
    };
    static emptyGroup(g) {
        while (g.children.length > 0) 
        {
            let obj = g.children.pop();
            this.disposeObject(obj);
        }
    };
    static roundTo(number, places) {
        let power = Math.pow(10, places);
        return Math.round(number * power) / power;
    }
}