/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// import { AnyAction } from "redux";
import { AmplifyConfigType } from "types";

export enum ActionType {
  INCREMENT_NUM,
  DECREMENT_NUM,
  CLOSE_SIDE_MENU,
  OPEN_SIDE_MENU,
  OPEN_INFO_BAR,
  CLOSE_INFO_BAR,
  SET_INFO_BAR_TYPE,
  UPDATE_USER_EMAIL,
  UPDATE_DOMAIN_MAP,
  UPDATE_AMPLIFY_CONFIG,
}

export interface AppStateProps {
  counter: number;
  userEmail: string;
  openSideMenu: boolean;
  amplifyConfig: any;
  domainMap: any;
  showInfoBar: boolean;
}

const initialState: AppStateProps = {
  counter: 0,
  userEmail: "",
  domainMap: {},
  amplifyConfig: {},
  openSideMenu: false,
  showInfoBar: false,
};

export type Action =
  | {
      type: ActionType.INCREMENT_NUM;
    }
  | {
      type: ActionType.DECREMENT_NUM;
    }
  | {
      type: ActionType.UPDATE_USER_EMAIL;
      email: string;
    }
  | {
      type: ActionType.UPDATE_DOMAIN_MAP;
      domainMap: any;
    }
  | {
      type: ActionType.UPDATE_AMPLIFY_CONFIG;
      amplifyConfig: AmplifyConfigType;
    }
  | {
      type: ActionType.OPEN_INFO_BAR;
    }
  | {
      type: ActionType.CLOSE_INFO_BAR;
    }
  | {
      type: ActionType.OPEN_SIDE_MENU;
    }
  | {
      type: ActionType.CLOSE_SIDE_MENU;
    };

const appReducer = (state = initialState, action: Action): AppStateProps => {
  switch (action.type) {
    case ActionType.INCREMENT_NUM:
      return { ...state, counter: state.counter + 1 };
    case ActionType.DECREMENT_NUM:
      return { ...state, counter: state.counter - 1 };
    case ActionType.UPDATE_USER_EMAIL:
      return { ...state, userEmail: action.email };
    case ActionType.UPDATE_DOMAIN_MAP:
      return { ...state, domainMap: action.domainMap };
    case ActionType.UPDATE_AMPLIFY_CONFIG:
      return { ...state, amplifyConfig: action.amplifyConfig };
    case ActionType.OPEN_INFO_BAR:
      return { ...state, showInfoBar: true };
    case ActionType.CLOSE_INFO_BAR:
      return { ...state, showInfoBar: false };
    case ActionType.OPEN_SIDE_MENU:
      return { ...state, openSideMenu: true };
    case ActionType.CLOSE_SIDE_MENU:
      return { ...state, openSideMenu: false };
    default:
      return state;
  }
};

export default appReducer;
