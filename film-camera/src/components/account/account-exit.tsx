import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useAction } from "../../hooks/use-action";
import { m } from "../../i18n";
import { logout, withdraw } from "../../lib/auth-actions";
import { Button, ErrorState, TextField } from "../ui";

/** 로그아웃과 탈퇴 — 탈퇴는 한 번 더 확인받는다(되돌릴 수 없다) */
export function AccountExit() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const { pending, error, run } = useAction();

  const leave = async () => {
    queryClient.clear();
    await router.navigate({ to: "/", replace: true });
  };
  const signOut = async () => {
    await logout();
    await leave();
  };
  const confirmWithdraw = async () => {
    const result = await run(() => withdraw({ data: { password } }));
    if (result.ok && result.data.done) await leave();
  };

  return (
    <section className="flex flex-col gap-4 border-line border-t pt-6">
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={signOut}>
          {m.account_logout()}
        </Button>
        <Button variant="secondary" className="text-sub" onClick={() => setConfirming((v) => !v)}>
          {m.account_withdraw()}
        </Button>
      </div>
      {confirming ? (
        <div className="flex flex-col gap-3 border border-line p-4">
          <p className="text-body text-sub">{m.account_withdraw_body()}</p>
          <TextField
            id="withdraw-password"
            label={m.login_password()}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <ErrorState message={error} /> : null}
          <Button
            variant="secondary"
            className="self-start"
            disabled={pending}
            onClick={confirmWithdraw}
          >
            {m.account_withdraw()}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
