export type RootStackParamList = {
  TextOne: undefined;
  TextTwo: {
    handoffFromTextOne?: boolean;
  } | undefined;
  Mixing: {
    handoffFromTextTwo?: boolean;
  } | undefined;
  Result: undefined;
};
