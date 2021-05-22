// import { map } from 'lodash-es';
// import {
//   hashParams,
//   QUERY_TYPE,
//   Q_TYPE_ITEM_REF,
//   Q_TYPE_KEY,
//   Q_TYPE_NORMALIZED_ARRAY,
// } from './key';

// export * from './saga';
// export * from './key';
// export * from './hooks';

// export const isNormalizedArray = (data) => {
//   return (
//     Boolean(data) &&
//     typeof data === 'object' &&
//     data[Q_TYPE_KEY] === Q_TYPE_NORMALIZED_ARRAY
//   );
// };
// export const isRefValue = (data) => {
//   return (
//     Boolean(data) &&
//     typeof data === 'object' &&
//     data[Q_TYPE_KEY] === Q_TYPE_ITEM_REF
//   );
// };

// export const normalizedQuerySingleResult = ({
//   key,
//   params,
//   value,
//   getId = (item) => item.id,
// }) => [
//   {
//     path: [QUERY_TYPE, key, hashParams(params), 'data'],
//     value: {
//       [Q_TYPE_KEY]: Q_TYPE_ITEM_REF,
//       key,
//       value: getId(value),
//     },
//   },
//   {
//     path: [key, hashParams(getId(value))],
//     value,
//   },
// ];
// export const normalizedQueryArrayResult = ({
//   key,
//   params,
//   itemKey,
//   value,
//   getId = (item) => item.id,
// }) => {
//   const results = [
//     {
//       path: [QUERY_TYPE, key, hashParams(params), 'data'],
//       value: {
//         [Q_TYPE_KEY]: Q_TYPE_NORMALIZED_ARRAY,
//         itemKey,
//         value: map(value, getId),
//       },
//     },
//     ...map(value, (item, index) => ({
//       path: [itemKey, hashParams(getId(item, index))],
//       value: item,
//     })),
//   ];

//   return results;
// };
