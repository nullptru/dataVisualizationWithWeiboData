import dbConnect from '../api/Weibo';

test('database connects success', () => {
    new dbConnect().insertTest();

});
