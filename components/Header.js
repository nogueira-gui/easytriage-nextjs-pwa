import Link from "next/link";
import Image from "next/image";

export default function Header() {
    return (
        <header>
            <nav style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#0d9356" }}>
                <ul style={{ display: "flex", alignItems: "center", margin: "10px" }}>
                    <li>
                        <Link href="/">
                            <Image src="/logo.webp" alt="Logo" width={100} height={50} />
                        </Link>
                    </li>
                </ul>
                <ul style={{ display: "flex", alignItems: "center", color: "whitesmoke", gap: "10px", paddingRight: "10px" }}>
                    <li>
                        <Link href="/about">NomePessoa</Link>
                    </li>
                    <li>
                        <Link href="/contact">Notificações</Link>
                    </li>
                    <li>
                        <Link href="/contact">Sair</Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}