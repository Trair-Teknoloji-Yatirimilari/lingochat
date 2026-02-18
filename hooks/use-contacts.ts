import { useState, useEffect } from "react";
import * as Contacts from "expo-contacts";
import { Platform } from "react-native";

export interface Contact {
  id: string;
  name: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
  emails?: Array<{ email: string; label?: string }>;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS === "web") {
      setError("Contacts not available on web");
      return false;
    }

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === "granted");
      return status === "granted";
    } catch (err) {
      setError("Failed to request contacts permission");
      return false;
    }
  };

  const fetchContacts = async () => {
    if (Platform.OS === "web") {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const permission = await requestPermission();
      if (!permission) {
        setError("Contacts permission not granted");
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      if (data && data.length > 0) {
        const formattedContacts: Contact[] = data
          .filter((contact: any) => contact.name && (contact.phoneNumbers || contact.emails))
          .map((contact: any) => ({
            id: contact.id || Math.random().toString(),
            name: contact.name || "Unknown",
            phoneNumbers: contact.phoneNumbers?.map((phone: any) => ({
              number: phone.number || "",
              label: phone.label,
            })),
            emails: contact.emails?.map((email: any) => ({
              email: email.email || "",
              label: email.label,
            })),
          }));

        setContacts(formattedContacts);
      }
    } catch (err) {
      setError("Failed to fetch contacts");
      console.error("Contacts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    loading,
    error,
    hasPermission,
    refetch: fetchContacts,
    requestPermission,
  };
}
