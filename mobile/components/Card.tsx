import React from 'react';
import { 
  StyleSheet, 
  View, 
  ViewStyle, 
  TouchableOpacity,
  TouchableOpacityProps
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  touchableProps?: TouchableOpacityProps;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  onPress,
  touchableProps
}) => {
  const cardStyles = [styles.card];
  
  if (style) {
    cardStyles.push(style);
  }
  
  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles} 
        onPress={onPress}
        activeOpacity={0.8}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

// Card.Header component
interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  const headerStyles = [styles.cardHeader];
  
  if (style) {
    headerStyles.push(style);
  }
  
  return (
    <View style={headerStyles}>
      {children}
    </View>
  );
};

// Card.Content component
interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  const contentStyles = [styles.cardContent];
  
  if (style) {
    contentStyles.push(style);
  }
  
  return (
    <View style={contentStyles}>
      {children}
    </View>
  );
};

// Card.Footer component
interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  const footerStyles = [styles.cardFooter];
  
  if (style) {
    footerStyles.push(style);
  }
  
  return (
    <View style={footerStyles}>
      {children}
    </View>
  );
};

// Attach components to Card
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 8,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardContent: {
    padding: 16,
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});

export default Card;