/**
 * Created by Burgess on 2017/3/25.
 */
import mapReducer from './mapReducer'
import commonReducer from './commonReducer'

let indexReducer = (state = {common: {}, map: {}}, action)=>{
    return {
        common: commonReducer(state,action),
        map : mapReducer(state, action)
    }
};

export default indexReducer;