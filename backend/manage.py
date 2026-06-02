"""Administration des comptes en ligne de commande.

Sert surtout à amorcer le premier administrateur. Au quotidien, la gestion des
utilisateurs se fait depuis la page Admin de l'application.

Exemples (depuis le conteneur backend ou un venv) :
    python manage.py create-admin --email patron@fingec.fr --password 'motdepasse'
    python manage.py create-user  --email stagiaire@fingec.fr --password 'motdepasse'
    python manage.py list
    python manage.py set-password --email x@fingec.fr --password 'nouveau'
    python manage.py deactivate --email x@fingec.fr
"""
import argparse
import getpass

import auth


def _password(args) -> str:
    if args.password:
        return args.password
    pwd = getpass.getpass("Mot de passe : ")
    if pwd != getpass.getpass("Confirmer : "):
        raise SystemExit("Les mots de passe ne correspondent pas.")
    return pwd


def main() -> None:
    parser = argparse.ArgumentParser(description="Gestion des utilisateurs Fingec")
    sub = parser.add_subparsers(dest="cmd", required=True)

    for name in ("create-admin", "create-user"):
        p = sub.add_parser(name)
        p.add_argument("--email", required=True)
        p.add_argument("--password", default="")
        p.add_argument("--name", default="")

    p = sub.add_parser("set-password")
    p.add_argument("--email", required=True)
    p.add_argument("--password", default="")

    p = sub.add_parser("deactivate")
    p.add_argument("--email", required=True)

    p = sub.add_parser("activate")
    p.add_argument("--email", required=True)

    sub.add_parser("list")

    args = parser.parse_args()
    auth.init_db()

    if args.cmd in ("create-admin", "create-user"):
        role = "admin" if args.cmd == "create-admin" else "user"
        user = auth.create_user(args.email, _password(args), args.name, role)
        print(f"✅ {role} créé : {user['email']} (id={user['id']})")

    elif args.cmd == "set-password":
        u = auth.get_user_by_email(args.email)
        if not u:
            raise SystemExit("Utilisateur introuvable.")
        auth.update_user(u["id"], password=_password(args))
        print(f"✅ Mot de passe mis à jour pour {u['email']}")

    elif args.cmd in ("deactivate", "activate"):
        u = auth.get_user_by_email(args.email)
        if not u:
            raise SystemExit("Utilisateur introuvable.")
        auth.update_user(u["id"], active=(args.cmd == "activate"))
        print(f"✅ {u['email']} {'activé' if args.cmd == 'activate' else 'désactivé'}")

    elif args.cmd == "list":
        for u in auth.list_users():
            flag = "✓" if u["active"] else "✗"
            print(f"  [{flag}] {u['id']:>3}  {u['role']:<5}  {u['email']}  {u['full_name']}")


if __name__ == "__main__":
    main()
