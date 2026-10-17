import React, { useEffect } from "react";
import { AppBar, BackIconComponent } from "@common/components";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "@settings/styles";

// Same header as Settings: AppBar instead of the native bar (see AppBar for the iOS 26 reason).
const useKidsHeader = (navigation, title) => {
  const { theme } = useTheme();
  const { headerTitleStyle, headerStyle } = useThemedStyles(createStyles);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <AppBar
      title={title}
      backgroundColor={headerStyle?.backgroundColor}
      titleColor={headerTitleStyle?.color}
      titleStyle={{ fontFamily: headerTitleStyle?.fontFamily }}
      leftComponent={<BackIconComponent size={30} color={theme.colors.primaryText} />}
    />
  );
};

export default useKidsHeader;
