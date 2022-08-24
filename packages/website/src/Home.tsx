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

import { Container, Header, SpaceBetween, Spinner } from '@cloudscape-design/components';
import { useContext, useEffect, useState } from 'react';
import { useApi } from './api-hook';
import { AppLayoutContext } from './App';

/**
 * Component to render the home "/" route.
 */
const Home: React.FC = () => {
  const { setAppLayoutProps } = useContext(AppLayoutContext);
  const [text, setText] = useState<string | undefined>();

  useEffect(() => {
    setAppLayoutProps({
      contentHeader: <Header>Home</Header>,
    });
  }, [setAppLayoutProps]);

  const api = useApi();
  useEffect(() => {
    api.sayHello({
      name: 'Prototyping Show',
    }).then(result => setText(result.message)).catch(e => console.error(e));
  }, []);

  return (
    <SpaceBetween size="l">
      <Container>
        {
          text ? <h1>{text}</h1> : <Spinner size="large" />
        }
      </Container>
    </SpaceBetween>
  );
};

export default Home;