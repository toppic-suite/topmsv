// The page scripts use $.trim, which current @types/jquery no longer
// declares (deprecated in jQuery 3, removed in 4 - which is why package.json
// pins jquery ^3). The runtime function exists; declare it for typechecking.
interface JQueryStatic {
  trim(text: string): string;
}
