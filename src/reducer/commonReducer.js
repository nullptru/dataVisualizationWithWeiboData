/**
 * Created by Burgess on 2017/3/25.
 */

let commonReducer = (state, action)=>{
    let common = new Object(state.common);
    switch (action.type){
        case "changeToProvince":
            common['selectedProvince'] = action.payload.id;
            common['selectedCity'] = action.payload.remove === true ? -1 : common['selectedCity'];
            common['currentMapLevel'] = 1;
            return common;
        case "changeToCity":
            common['selectedCity'] = action.payload.id;
            common['selectedProvince'] = action.payload.remove === true ? -1 : common['selectedProvince'];
            common['currentMapLevel'] = 2;
            return common;
        case "changeToChina":
            common['selectedCity'] = -1;
            common['selectedProvince'] = -1;
            common['currentMapLevel'] = 0;
            return common;
        case "updateDataStore":
            if (common.dataStore === undefined) common.dataStore = {};
            switch (action.payload.level){
                case 0: common.dataStore.provinceStore = action.payload.data;
                    break;
                case 1: common.dataStore.cityStore = action.payload.data;
                    break;
                case 2: common.dataStore.areaStore = action.payload.data;
                default : break
            }
            return common;
        case "getData":
            return common;
        default: return state.common;
    }
};

export default commonReducer;