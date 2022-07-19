/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

import {
  BreadcrumbGroup,
  BreadcrumbGroupProps,
  SideNavigation,
  SideNavigationProps,
  TopNavigation,
} from '@cloudscape-design/components';
import AppLayout, { AppLayoutProps } from '@cloudscape-design/components/app-layout';
import { CancelableEventHandler } from '@cloudscape-design/components/internal/events';
import { applyDensity, applyMode, Density, Mode } from '@cloudscape-design/global-styles';
import { createContext, useCallback, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Auth from './Auth';
import Config from './config.json';
import Home from './Home';

/**
 * Define your nav items here.
 */
const NAVIGATION_ITEMS: SideNavigationProps.Item[] = [
  { text: 'home', type: 'link', href: '/' },
];

/**
 * Context for updating/retrieving the AppLayout.
 */
export const AppLayoutContext = createContext({
  appLayoutProps: {},
  setAppLayoutProps: (_: AppLayoutProps) => {},
});

/**
 * Finds a Nav Item matching the provided href.
 *
 * @param href href to search for
 * @param root root nav items to begin search
 * @returns a nav item matching href or undefined.
 */
const findNavItem = (href: string, root?: SideNavigationProps.Item[]): SideNavigationProps.Item | undefined =>
  root?.find((i: any) => i?.href === href) || root?.map((i: any) => findNavItem(href, i?.items))?.find((i: any) => i?.href === href);

/**
 * Defines the App layout and contains logic for routing.
 */
const App: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('theme.light');
  const [density, setDensity] = useState('density.comfortable');
  const [activeHref, setActiveHref] = useState('/');
  const [activeBreadcrumbs, setActiveBreadcrumbs] = useState<BreadcrumbGroupProps.Item[]>([{ text: '/', href: '/' }]);
  const [appLayoutProps, setAppLayoutProps] = useState<AppLayoutProps>({});

  const setAppLayoutPropsSafe = useCallback((props: AppLayoutProps) => {
    JSON.stringify(appLayoutProps) !== JSON.stringify(props) && setAppLayoutProps(props);
  }, [appLayoutProps]);

  const onNavigate = useMemo((): CancelableEventHandler<BreadcrumbGroupProps.ClickDetail | SideNavigationProps.FollowDetail> => (e) => {
    e.preventDefault();
    setAppLayoutProps({});
    setActiveHref(e.detail.href);

    const segments = ['/', ...e.detail.href.split('/').filter(segment => segment !== '')];
    setActiveBreadcrumbs(segments
      .map((segment, i) => {
        const href = segments.slice(0, i+1).join('/').replace('//', '/');
        return {
          href,
          text: segment,
        };
      })
      .filter((item: any) => findNavItem(item?.href, NAVIGATION_ITEMS)),
    );
    navigate(e.detail.href);
  }, [navigate, setAppLayoutProps, setActiveBreadcrumbs]);

  return (
    <Auth>
      <TopNavigation
        key={'header'}
        utilities={[{
          type: 'menu-dropdown',
          iconName: 'settings',
          ariaLabel: 'Settings',
          title: 'Settings',
          items: [{
            id: 'theme',
            text: 'Theme',
            items: [
              {
                id: 'theme.light',
                text: 'Light',
                disabled: theme === 'theme.light',
                disabledReason: 'currently selected',
              },
              {
                id: 'theme.dark',
                text: 'Dark',
                disabled: theme === 'theme.dark',
                disabledReason: 'currently selected',
              },
            ],
          }, {
            id: 'density',
            text: 'Density',
            items: [
              {
                id: 'density.comfortable',
                text: 'Comfortable',
                disabled: density === 'density.comfortable',
                disabledReason: 'currently selected',
              },
              {
                id: 'density.compact',
                text: 'Compact',
                disabled: density === 'density.compact',
                disabledReason: 'currently selected',
              },
            ],
          }],
          onItemClick: (e) => {
            switch (e.detail.id) {
              case 'theme.light':
                applyMode(Mode.Light);
                setTheme('theme.light');
                break;
              case 'theme.dark':
                applyMode(Mode.Dark);
                setTheme('theme.dark');
                break;
              case 'density.comfortable':
                applyDensity(Density.Comfortable);
                setDensity('density.comfortable');
                break;
              case 'density.compact':
                applyDensity(Density.Compact);
                setDensity('density.compact');
                break;
              default:
                break;
            }
          },
        }]}
        i18nStrings={{ overflowMenuTitleText: 'Header', overflowMenuTriggerText: 'Header' }}
        identity={{ title: Config.applicationName, href: '', logo: { src: 'logo512.png' } }}/>
      <AppLayout
        headerSelector="header"
        breadcrumbs={<BreadcrumbGroup
          onFollow={onNavigate}
          items={activeBreadcrumbs}/>}
        toolsHide
        navigation={
          <SideNavigation
            header={{ text: Config.applicationName, href: '/' }}
            activeHref={activeHref}
            onFollow={onNavigate}
            items={NAVIGATION_ITEMS}
          />}
        content={
          <AppLayoutContext.Provider value={{ appLayoutProps, setAppLayoutProps: setAppLayoutPropsSafe }}>
            <Routes>
              { /* Define all your routes here */ }
              <Route path="/" element={<Home/>}/>
            </Routes>
          </AppLayoutContext.Provider>
        }
        {...appLayoutProps}
      />
    </Auth>
  );
};

export default App;