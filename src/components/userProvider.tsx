import { bindMiniAppCSSVars, bindThemeParamsCSSVars, bindViewportCSSVars, useMiniApp, useThemeParams, useViewport } from "@tma.js/sdk-react";
import { ReactNode, createContext, useEffect } from "react";
import useUser from "~/hooks/useUser";
import Loading from "~/loading";
import { User } from "~/shared";
import Unautharized from "./unautharized";

export const userContext = createContext<User | null>(null);

export default function UserProvider({
  children
}: {
  children: ReactNode
}) {
  const user = useUser();
  const miniApp = useMiniApp();
  const themeParams = useThemeParams();
  const viewport = useViewport();

  useEffect(() => {
    return bindMiniAppCSSVars(miniApp, themeParams);
  }, [miniApp, themeParams]);

  useEffect(() => {
    return bindThemeParamsCSSVars(themeParams);
  }, [themeParams]);

  useEffect(() => {
    if (viewport) {
      return bindViewportCSSVars(viewport);
    }
  }, [viewport]);

  return (
    <userContext.Provider value={user.user}>
      {user.isPending ? (
        <Loading />
      ) : (
        <>
          {user.user?.role === "ADMIN" ? children : <Unautharized />}
        </>
      )}
    </userContext.Provider>
  );
}
