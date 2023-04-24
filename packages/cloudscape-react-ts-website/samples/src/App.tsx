/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { useCognitoAuthContext } from '@aws-northstar/ui';
import AppLayout, {
  AppLayoutProps,
} from '@aws-northstar/ui/components/AppLayout';
import {
  BreadcrumbGroup,
  BreadcrumbGroupProps,
  SideNavigation,
  SideNavigationProps,
} from '@cloudscape-design/components';
import { CancelableEventHandler } from '@cloudscape-design/components/internal/events';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Config from './config.json';
import Home from './Home';

/**
 * Define your nav items here.
 */
const NAVIGATION_ITEMS: SideNavigationProps.Item[] = [
  { text: 'Home', type: 'link', href: '/' },
];

/**
 * Context for updating/retrieving the AppLayout.
 */
export const AppLayoutContext = createContext({
  appLayoutProps: {},
  setAppLayoutProps: (_: Partial<AppLayoutProps>) => {},
});


const getBreadcrumbs = (path: string) => {
  const segments = [
    '/',
    ...path.split('/').filter((segment) => segment !== ''),
  ];
  return segments.map((segment, i) => {
    const href = segments
      .slice(0, i + 1)
      .join('/')
      .replace('//', '/');
    return {
      href,
      text: segment,
    };
  });
};

/**
 * Defines the App layout and contains logic for routing.
 */
const App: React.FC = () => {
  const navigate = useNavigate();
  const [activeHref, setActiveHref] = useState(window.location.pathname);
  const [username, setUsername] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [activeBreadcrumbs, setActiveBreadcrumbs] = useState<
  BreadcrumbGroupProps.Item[]
  >(getBreadcrumbs(window.location.pathname));
  const [appLayoutProps, setAppLayoutProps] = useState<Partial<AppLayoutProps>>(
    {},
  );
  const { getAuthenticatedUser } = useCognitoAuthContext();

  useEffect(() => {
    if (getAuthenticatedUser) {
      const authUser = getAuthenticatedUser();
      setUsername(authUser?.getUsername());

      authUser?.getSession(() => {
        authUser.getUserAttributes((_, attributes) => {
          setEmail(attributes?.find(a => a.Name === 'email')?.Value);
        });
      });
    }
  }, [getAuthenticatedUser, setUsername, setEmail]);

  const setAppLayoutPropsSafe = useCallback(
    (props: Partial<AppLayoutProps>) => {
      JSON.stringify(appLayoutProps) !== JSON.stringify(props) &&
        setAppLayoutProps(props);
    },
    [appLayoutProps],
  );

  const onNavigate = useMemo(
    (): CancelableEventHandler<
    BreadcrumbGroupProps.ClickDetail | SideNavigationProps.FollowDetail
    > =>
      (e) => {
        e.preventDefault();
        setAppLayoutProps({});
        setActiveHref(e.detail.href);
        setActiveBreadcrumbs(
          getBreadcrumbs(e.detail.href),
        );
        navigate(e.detail.href);
      },
    [navigate, setAppLayoutProps, setActiveBreadcrumbs],
  );

  return (
    <AppLayout
      title={Config.applicationName}
      logo="/logo512.png"
      navigationItems={NAVIGATION_ITEMS}
      breadcrumbs={
        <BreadcrumbGroup onFollow={onNavigate} items={activeBreadcrumbs} />
      }
      navigation={
        <SideNavigation
          header={{ text: Config.applicationName, href: '/' }}
          activeHref={activeHref}
          onFollow={onNavigate}
          items={NAVIGATION_ITEMS}
        />}
      toolsHide
      onSignout={() => new Promise(() => {
        getAuthenticatedUser && getAuthenticatedUser()?.signOut();
        window.location.href = '/';
      })}
      user={username ? {
        username,
        email,
      } : undefined}
      content={
        <AppLayoutContext.Provider
          value={{ appLayoutProps, setAppLayoutProps: setAppLayoutPropsSafe }}
        >
          <Routes>
            {/* Define all your routes here */}
            <Route path="/" element={<Home />} />
          </Routes>
        </AppLayoutContext.Provider>
      }
      {...appLayoutProps}
    />
  );
};

export default App;
