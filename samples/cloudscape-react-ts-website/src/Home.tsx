/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Container, ContentLayout, Header, SpaceBetween } from '@cloudscape-design/components';

/**
 * Component to render the home "/" route.
 */
const Home: React.FC = () => {
  return (
    <ContentLayout header={<Header>Home</Header>}>
      <SpaceBetween size="l">
        <Container>
          Hello!
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
};

export default Home;