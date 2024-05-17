import { SDKProvider, type SDKInitOptions } from '@tma.js/sdk-react';

export function SDKP() {
  const options: SDKInitOptions = {
    acceptCustomStyles: true,
    cssVars: true,
  };

  return (
    <SDKProvider options={options}>
      <div>My application!</div>
    </SDKProvider>
  );
}
