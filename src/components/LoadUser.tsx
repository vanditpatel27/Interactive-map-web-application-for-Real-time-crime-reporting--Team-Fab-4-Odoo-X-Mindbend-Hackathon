"use client";

import { useUserLoaded, useUser } from "@/hooks/user";
import { useEffect } from "react";

export default function LoadUser() {
  const [_, setUser] = useUser();
  const [userLoaded, setUserLoaded] = useUserLoaded();
  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setUser(data.user);
      })
      .catch((error) => console.error(error))
      .finally(() => setUserLoaded(true));
  }, []);
  return <></>;
}
