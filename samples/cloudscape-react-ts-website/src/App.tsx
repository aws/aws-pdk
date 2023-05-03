/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { useCognitoAuthContext } from '@aws-northstar/ui';
import AppLayout from '@aws-northstar/ui/components/AppLayout';
import {
  SideNavigationProps,
} from '@cloudscape-design/components';
import { ReactNode, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Config from './config.json';
import Home from './Home';

/**
 * Define your nav items here.
 */
const NAVIGATION_ITEMS: (SideNavigationProps.Item & { element: ReactNode })[] = [
  { text: 'Home', type: 'link', href: '/', element: <Home /> },
];

/**
 * Defines the App layout and contains logic for routing.
 */
const App: React.FC = () => {
  const [username, setUsername] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
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

  return (
    <AppLayout
      title={Config.applicationName}
      logo="/logo512.png"
      navigationItems={NAVIGATION_ITEMS}
      onSignout={() => new Promise(() => {
        getAuthenticatedUser && getAuthenticatedUser()?.signOut();
        window.location.href = '/';
      })}
      user={username ? {
        username,
        email,
      } : undefined}
    >
      <Routes>
        {
          NAVIGATION_ITEMS
            .filter(item => item.type === 'link')
            .map((item, idx) => <Route key={idx} path={item.type === 'link' ? item.href : ''} element={item.element} />)}
      </Routes>
    </AppLayout>
  );
};

export default App;
