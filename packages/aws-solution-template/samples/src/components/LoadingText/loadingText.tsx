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
import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";

interface LoadingTextProps {
  text?: string;
  color?: string;
}

const LoadingText: React.FC<LoadingTextProps> = (props: LoadingTextProps) => {
  const { text, color } = props;
  return (
    <span className="gsui-loading">
      <CircularProgress style={{ color: color }} className="icon" size="15" />
      {text}
    </span>
  );
};

export default LoadingText;
