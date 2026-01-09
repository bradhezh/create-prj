import { option } from "@/conf/conf";
import type { Option } from "@/conf/conf";
import { message } from "@/conf/message";

type OptionKey = keyof Option;
type OptionVal = Option[OptionKey];
type NonOptionalKey = Exclude<OptionKey, "optional">;

const none = { value: undefined, label: "None" } as const;

export const prompt = {
  name: {
    message: message.name.q,
    initialValue: message.name.initial,
    validate: (value?: string) => (value ? undefined : message.name.validate),
  },
  ...(Object.fromEntries(
    (
      (Object.entries(option) as [OptionKey, OptionVal][]).filter(
        ([k, v]) => k !== "optional" && Object.keys(v).length > 1,
      ) as [NonOptionalKey, OptionVal][]
    ).map(([k, v]) => [
      k,
      {
        disable: false,
        selection: {
          message: message[k].q,
          options: Object.keys(v).map((e) => ({
            value: e,
            label: (message[k] as any)[e],
          })),
        },
      },
    ]),
  ) as {
    [K in NonOptionalKey]?: {
      disable: boolean;
      selection: {
        message: string;
        options: { value: keyof Option[K]; label: string }[];
      };
    };
  }),
  ...(Object.fromEntries(
    (Object.keys(option.optional) as OptionalKey[])
      .filter(
        (e) =>
          e in option.type &&
          (Object.values(option.optional[e]) as TypeOptionalValVal[]).filter(
            (e0) =>
              Array.isArray(e0) ? e0.length : Object.keys(e0).length > 1,
          ).length,
      )
      .map((e) => [
        e,
        Object.fromEntries(
          (
            Object.entries(option.optional[e]) as [
              TypeOptionalValKey,
              TypeOptionalValVal,
            ][]
          )
            .filter(([_k, v]) =>
              Array.isArray(v) ? v.length : Object.keys(v).length > 1,
            )
            .map(([k, v]) => {
              const msgu = message[e] as any;
              return [
                k,
                {
                  message: msgu[k].q,
                  options: Array.isArray(v)
                    ? v.map((e0) => ({
                        value: e0,
                        label: msgu[k][e0],
                      }))
                    : Object.keys(v).map((e0) => ({
                        value: e0,
                        label: msgu[k][e0],
                      })),
                },
              ];
            }),
        ),
      ]),
  ) as {
    [K in TypeOptionalKey]?: {
      [K0 in keyof Optional[K]]?: {
        message: string;
        options: {
          value: Optional[K][K0] extends unknown[]
            ? Optional[K][K0][number]
            : keyof Optional[K][K0];
          label: string;
        }[];
      };
    };
  }),
  ...(Object.fromEntries(
    (
      Object.entries(option.optional).filter(
        ([k, _v]) => !(k in option.type),
      ) as [NonTypeOptionalKey, OptionalVal][]
    ).map(([k, v]) => [
      k,
      {
        disable: false,
        selection: {
          message: message[k].q,
          options: [
            ...Object.keys(v).map((e) => ({
              value: e,
              label: (message[k] as any)[e],
            })),
            none,
          ],
        },
      },
    ]),
  ) as {
    [K in NonTypeOptionalKey]: {
      disable: boolean;
      selection: {
        message: string;
        options: { value: keyof Optional[K]; label: string }[];
      };
    };
  }),
  defaults: {
    message: message.defaults.q,
    options: [
      { value: defaults.option.default, label: message.defaults.default },
      { value: defaults.option.manual, label: message.defaults.manual },
      none,
    ],
  },
  message,
  noteWidth: 70,
};

export type Spinner = {
  start: (msg?: string) => void;
  stop: (msg?: string, code?: number) => void;
};
