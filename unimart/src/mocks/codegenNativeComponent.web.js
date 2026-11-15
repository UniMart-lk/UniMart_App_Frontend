export default function codegenNativeComponent(componentName) {
  function DummyNativeComponent() {
    return null;
  }
  DummyNativeComponent.displayName = componentName || 'DummyNativeComponent';
  return DummyNativeComponent;
}
