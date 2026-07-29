"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PURGE_CONFIRM_FINAL,
  PURGE_CONFIRM_PHRASE,
} from "@/lib/purge-confirm";

type ClearAllDataDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  loading?: boolean;
  onConfirm: (payload: {
    confirmPhrase: string;
    confirmEmail: string;
    confirmFinal: string;
  }) => void | Promise<void>;
};

export function ClearAllDataDialog({
  open,
  onOpenChange,
  userEmail,
  loading = false,
  onConfirm,
}: ClearAllDataDialogProps) {
  const [step, setStep] = React.useState(1);
  const [understood, setUnderstood] = React.useState(false);
  const [phrase, setPhrase] = React.useState("");
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setUnderstood(false);
      setPhrase("");
      setEmail("");
    }
  }, [open]);

  const phraseOk = phrase.trim() === PURGE_CONFIRM_PHRASE;
  const emailOk =
    email.trim().toLowerCase() === userEmail.trim().toLowerCase();

  async function handleFinal() {
    if (!phraseOk || !emailOk) return;
    await onConfirm({
      confirmPhrase: PURGE_CONFIRM_PHRASE,
      confirmEmail: userEmail.trim().toLowerCase(),
      confirmFinal: PURGE_CONFIRM_FINAL,
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Apagar todos os dados
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              {step === 1 ? (
                <>
                  <p>
                    Esta ação remove <strong>permanentemente</strong> todas as
                    transações, contas, categorias, orçamentos, metas,
                    aportes e notificações.
                  </p>
                  <p>
                    Sua conta de login (e-mail e senha) permanece. Uma conta
                    padrão e categorias iniciais serão recriadas.
                  </p>
                  <p className="font-medium text-foreground">
                    Confirmação 1 de 3 — leia e marque o entendimento.
                  </p>
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <Checkbox
                      id="purge-understood"
                      checked={understood}
                      onCheckedChange={(checked) =>
                        setUnderstood(checked === true)
                      }
                    />
                    <Label
                      htmlFor="purge-understood"
                      className="cursor-pointer text-sm leading-snug text-foreground"
                    >
                      Entendo que esta ação é irreversível e que não poderei
                      recuperar os dados sem um backup.
                    </Label>
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <p className="font-medium text-foreground">
                    Confirmação 2 de 3 — digite a frase abaixo exatamente:
                  </p>
                  <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm font-semibold tracking-wide text-foreground">
                    {PURGE_CONFIRM_PHRASE}
                  </p>
                  <Input
                    autoFocus
                    value={phrase}
                    onChange={(event) => setPhrase(event.target.value)}
                    placeholder={PURGE_CONFIRM_PHRASE}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <p className="font-medium text-foreground">
                    Confirmação 3 de 3 — digite o e-mail da sua conta:
                  </p>
                  <p className="text-xs">
                    Conta: <span className="font-medium">{userEmail}</span>
                  </p>
                  <Input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="off"
                  />
                  <p className="text-xs text-destructive">
                    Ao confirmar, todos os dados financeiros serão apagados
                    agora.
                  </p>
                </>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>

          {step === 1 ? (
            <Button
              type="button"
              variant="destructive"
              disabled={!understood || loading}
              onClick={() => setStep(2)}
            >
              Continuar
            </Button>
          ) : null}

          {step === 2 ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!phraseOk || loading}
                onClick={() => setStep(3)}
              >
                Continuar
              </Button>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setStep(2)}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!emailOk || loading}
                onClick={() => void handleFinal()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Apagando...
                  </>
                ) : (
                  "Apagar tudo definitivamente"
                )}
              </Button>
            </>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
